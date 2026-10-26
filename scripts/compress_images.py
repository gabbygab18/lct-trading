"""Re-save the site's photos smaller, in place.

    python scripts/compress_images.py [folder ...]   (default: public/images)

WebP at quality 75 and JPEG at 80 look the same as the originals on a product
card and cut most files by a third to a half. A file is only replaced when
the new one is at least 5% smaller, so running it twice changes nothing.
PNGs (the logo mark) and lossless brand logos are left alone.
"""
import io
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
folders = [Path(a) for a in sys.argv[1:]] or [ROOT / "public" / "images"]

before = after = changed = 0
for folder in folders:
    for f in folder.rglob("*"):
        ext = f.suffix.lower()
        if ext not in (".webp", ".jpg", ".jpeg") or "brands" in f.parts:
            continue
        old = f.stat().st_size
        im = Image.open(f)
        if getattr(im, "is_animated", False):
            continue
        buf = io.BytesIO()
        if ext == ".webp":
            im.save(buf, "WEBP", quality=75, method=6, exact=im.mode == "RGBA")
        else:
            im.convert("RGB").save(buf, "JPEG", quality=80, optimize=True, progressive=True)
        im.close()
        before += old
        if buf.tell() < old * 0.95:
            f.write_bytes(buf.getvalue())
            after += buf.tell()
            changed += 1
        else:
            after += old

print(f"{changed} files smaller: {before / 1e6:.1f} MB -> {after / 1e6:.1f} MB")
