"""Build the Z.com (cPanel) upload zips. See DEPLOY.md.

    python scripts/make_deploy.py

Writes to deploy/:
  lct-trading-full-deploy.zip       extract in the home dir -> ~/lct-trading/
  lct-trading-public_html-ready.zip extract inside ~/public_html/
  lct-trading-production.sql.gz     phpMyAdmin import (first deploy only), if
                                    deploy/lct-trading-production.sql exists

Runs `npm run build`, then `composer install --no-dev` in a scratch copy so
the local vendor/ keeps its dev packages.
"""

import base64
import gzip
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "deploy"
APP = "lct-trading"  # folder name next to public_html on the server

# Tracked files the server never needs (public/ ships in the public_html zip).
SKIP_APP = ("public/", "tests/", "scripts/", ".impeccable/", "deploy/", ".github/")

# public_html/index.php: points at the app folder beside public_html, and tells
# Laravel that public_html is the public dir (GalleryCache and the photo
# lookups write/read through public_path()).
INDEX_PHP = f"""<?php

use Illuminate\\Foundation\\Application;
use Illuminate\\Http\\Request;

define('LARAVEL_START', microtime(true));

/*
| The Laravel app lives OUTSIDE public_html, side by side with it:
|
|   /home/<cpanel-user>/{APP}    <- app
|   /home/<cpanel-user>/public_html    <- this file
|
| If the app is moved, put its full path here, e.g. '/home/abc123/{APP}'.
*/
$app_path = dirname(__DIR__).'/{APP}';

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = $app_path.'/storage/framework/maintenance.php')) {{
    require $maintenance;
}}

// Register the Composer autoloader...
require $app_path.'/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once $app_path.'/bootstrap/app.php';

// public_html is the public folder, not {APP}/public.
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
"""

STORAGE_LINK_PHP = f"""<?php

/*
| One-time helper: creates public_html/storage -> ../{APP}/storage/app/public
| (admin photo uploads). Open https://your-domain/_storage-link.php once,
| check it says OK. Once the link exists it deletes itself.
*/

header('Content-Type: text/plain; charset=utf-8');

$target = dirname(__DIR__).'/{APP}/storage/app/public';
$link   = __DIR__.'/storage';

if (! is_dir($target)) {{
    exit("FAILED: target folder not found:\\n  {{$target}}\\n\\nExtract the app zip in the home directory (one level above public_html).\\n");
}}
if (is_link($link)) {{
    @unlink(__FILE__); // it shows server paths: don't leave it public
    exit("Already linked. This helper has deleted itself.\\n");
}}
if (file_exists($link)) {{
    exit("FAILED: something already exists at\\n  {{$link}}\\n\\nRemove it first, then reload this page.\\n");
}}
if (function_exists('symlink') && @symlink($target, $link)) {{
    @unlink(__FILE__);
    exit("OK: symlink created. This helper has deleted itself.\\n");
}}
echo "FAILED: symlink() is disabled or returned false.\\n\\nRun this in cPanel Terminal instead:\\n  ln -s {{$target}} {{$link}}\\n";
"""


def run(cmd, cwd=ROOT):
    print(">", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True, shell=True)


def build():
    """npm run build, refusing a build that points fonts at this PC's disk.

    Run from a lower-case drive (c:\\...), Vite writes url(../../C:/Users/...)
    for the fonts, which 404 on the server."""
    run(["npm", "run", "build"], cwd=Path(str(ROOT)[0].upper() + str(ROOT)[1:]))
    bad = [p.name for p in (ROOT / "public/build/assets").glob("*.css") if ":/Users/" in p.read_text(encoding="utf-8")]
    if bad:
        sys.exit(f"Build has local disk paths in {bad}; run again from C:\\ (capital C).")


def files():
    out = subprocess.run(
        ["git", "ls-files", "-co", "--exclude-standard", "-z"],
        cwd=ROOT, check=True, capture_output=True,
    ).stdout.decode()
    return [f for f in out.split("\0") if f and (ROOT / f).is_file()]


def main():
    OUT.mkdir(exist_ok=True)
    build()
    tracked = files()

    with tempfile.TemporaryDirectory() as tmp:
        stage = Path(tmp) / APP
        for f in tracked:
            if not f.startswith(SKIP_APP):
                (stage / f).parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(ROOT / f, stage / f)
        env = stage / ".env.production.example"
        key = "base64:" + base64.b64encode(os.urandom(32)).decode()
        env.write_text(env.read_text().replace("APP_KEY=\n", f"APP_KEY={key}\n", 1))
        run(["composer", "install", "--no-dev", "--optimize-autoloader",
             "--no-interaction", "--no-scripts"], cwd=stage)
        # Package discovery without dev packages (pail, sail, collision).
        run(["php", "artisan", "package:discover"], cwd=stage)

        app_zip = OUT / f"{APP}-full-deploy.zip"
        with zipfile.ZipFile(app_zip, "w", zipfile.ZIP_DEFLATED) as z:
            for p in sorted(stage.rglob("*")):
                rel = p.relative_to(stage.parent).as_posix()
                if p.is_dir():
                    z.writestr(rel + "/", "")  # keeps empty storage/ dirs
                else:
                    z.write(p, rel)
        print(f"{app_zip.name}: {app_zip.stat().st_size / 1e6:.1f} MB")

    pub_zip = OUT / f"{APP}-public_html-ready.zip"
    public = [f for f in tracked if f.startswith("public/") and f != "public/index.php"]
    public += [p.relative_to(ROOT).as_posix() for p in (ROOT / "public/build").rglob("*") if p.is_file()]
    with zipfile.ZipFile(pub_zip, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(set(public)):
            z.write(ROOT / f, f.removeprefix("public/"))
        z.writestr("index.php", INDEX_PHP)
        z.writestr("_storage-link.php", STORAGE_LINK_PHP)
    print(f"{pub_zip.name}: {pub_zip.stat().st_size / 1e6:.1f} MB")

    sql = OUT / f"{APP}-production.sql"
    if sql.exists():
        with open(sql, "rb") as src, gzip.open(f"{sql}.gz", "wb") as dst:
            shutil.copyfileobj(src, dst)
        print(f"{sql.name}.gz: {Path(f'{sql}.gz').stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
