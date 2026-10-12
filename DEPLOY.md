# LCT Trading — Z.com (cPanel) deployment

Same layout as the elnovian / Isla deploys: **the app lives outside `public_html`**,
and only Laravel's `public/` contents go inside `public_html`.

```
/home/<cpanel-user>/
├── lct-trading/               ← lct-trading-full-deploy.zip extracts here
│   ├── app/ bootstrap/ config/ database/ resources/ routes/ storage/ vendor/
│   └── .env                   ← you create this from .env.production.example
└── public_html/               ← lct-trading-public_html-ready.zip extracts here
    ├── index.php              ← already points at ../lct-trading
    ├── .htaccess  build/  images/  favicon.ico  robots.txt
    └── storage → ../lct-trading/storage/app/public   (symlink, step 5)
```

There is no `lct-trading/public/` on the server, on purpose: `public_html/index.php`
tells Laravel that `public_html` is the public folder, so product photos and the
cached galleries are read and written there.

Node/npm are **not** needed on the server — `build/` is already compiled.

## Build the package (on this PC)

```bash
python scripts/make_deploy.py
```

Writes to `deploy/` (gitignored):

| File | Goes to |
|---|---|
| `lct-trading-full-deploy.zip` (~9 MB) | home directory, next to `public_html` |
| `lct-trading-public_html-ready.zip` (~180 MB, mostly product photos) | inside `public_html` |
| `lct-trading-production.sql.gz` (~3 MB) | phpMyAdmin import, **first deploy only** |

The script runs `npm run build`, installs `vendor/` without dev packages in a
scratch copy, and writes a fresh `APP_KEY` into the zipped `.env.production.example`.

The SQL dump is the local catalog (18,542 items, settings, admin user) converted
to MySQL. Regenerate it only for a first deploy; after go-live the live database is
the source of truth.

---

## First deploy

### 1. PHP 8.2 or higher
Z.com cPanel → **Select PHP Version** (or **MultiPHP Manager**, depending on the
plan) → PHP 8.3 (8.2 minimum). Extensions on: `pdo_mysql`, `mbstring`, `openssl`,
`tokenizer`, `xml`, `ctype`, `fileinfo`, `curl`, `zip`, `intl`.

PHP options (same screen, or **MultiPHP INI Editor**):

| Directive | Set to | Why |
|---|---|---|
| `upload_max_filesize` | `32M` | Excel/CSV item lists and product photos in `/admin` |
| `post_max_size` | `32M` | must be ≥ `upload_max_filesize` |
| `memory_limit` | `256M` | bulk item import (thousands of rows) |
| `max_execution_time` | `120` | bulk import, first open of a product gallery |
| `opcache.enable` | `1` | keeps compiled PHP in memory; the single biggest speed-up per request |

Leave `display_errors` **Off**.

### 2. Upload the app files
File Manager → home directory (the level *above* `public_html`) → Upload
`lct-trading-full-deploy.zip` → right-click → **Extract**. You should end up with
`/home/<cpanel-user>/lct-trading/`. Delete the zip afterwards.

### 3. Upload the public files
File Manager → `public_html` → delete any `default.html` / `index.html` placeholder →
Upload `lct-trading-public_html-ready.zip` → **Extract**. Delete the zip afterwards.

> 180 MB is large for a browser upload. If File Manager stalls, upload it over FTP
> (FileZilla, the FTP account from cPanel → **FTP Accounts**) and then Extract in
> File Manager.

### 4. Database and `.env`
1. cPanel → **MySQL Databases** → create a database and a user, add the user to
   the database with **All Privileges**.
2. In `/home/<cpanel-user>/lct-trading/`, rename `.env.production.example` → `.env`
   (File Manager → *Settings → Show Hidden Files* to see dotfiles).
3. Edit `.env`: `APP_URL` (with `https://`), `DB_DATABASE`, `DB_USERNAME`,
   `DB_PASSWORD`, and the `MAIL_*` values. `APP_KEY` is already filled in.

### 5. Link the uploads folder
Photos uploaded in `/admin` are saved in `lct-trading/storage/app/public`, so
`public_html/storage` has to point at it.

**With Terminal** (cPanel → Terminal, or SSH):
```bash
ln -s ~/lct-trading/storage/app/public ~/public_html/storage
```

**Without Terminal:** open `https://your-domain.com/_storage-link.php` once — it
creates the link and prints the result. **Delete `_storage-link.php` afterwards.**

Don't use `php artisan storage:link`: from the command line Laravel doesn't know
about `public_html` and would create the link in the wrong place.

### 6. Import the database
cPanel → **phpMyAdmin** → select the new database → **Import** → choose
`lct-trading-production.sql.gz` → Go.

Do **not** run `php artisan migrate` first: the dump carries the schema and a full
`migrations` table (9 rows, matching this codebase), so migrating first would
collide. It has no `CREATE DATABASE` / `USE`, so it imports into whatever name you
created in step 4.

What comes across: all items (sample khmtools rows still flagged "Sample", plus the
Wixim / Setsu / boards / Champ / extra supplier items), the 10 settings (contact
fields are still placeholders), and the admin user **with the same password as on
this PC**. The local test order, sessions and cache were left out.

### 7. Cron job (order emails)
Order and inquiry emails are queued, not sent during the visitor's request.
cPanel → **Cron Jobs** → *Once Per Minute* (`* * * * *`):

```cron
cd /home/<cpanel-user>/lct-trading && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1
```

The PHP path differs between hosts; the Cron Jobs page usually shows it, or ask
Z.com support for the CLI path of PHP 8.3 (e.g. `/opt/cpanel/ea-php83/root/usr/bin/php`
or `/opt/alt/php83/usr/bin/php`). Without this cron, orders are saved but never emailed.

### 8. SSL, cache, final checks
- cPanel → **SSL/TLS Status** → *Run AutoSSL* for the domain.
- With Terminal, warm the caches (re-run after every `.env` edit):
  ```bash
  cd ~/lct-trading && php artisan config:cache && php artisan route:cache && php artisan view:cache
  ```
  Without Terminal, skip this; the site works uncached, only slower on every request.
- Sessions and cache use files (`SESSION_DRIVER=file`, `CACHE_STORE=file` in `.env`):
  on one shared server that's faster than a database round trip for each page.
  The nightly `cache:clear` (from the cron in step 7) keeps the cache folder small.
- Log in at `https://your-domain.com/admin` and fill in **Settings** (order email,
  phone, address, hours, bank details) — the store shows placeholders until then.
- Place a test order from the site and confirm the email arrives (within a minute,
  via the cron).

### Before go-live (client data)
The khmtools rows are placeholders. Upload LCT's own list at **Admin → Excel / CSV
upload**, then press **Remove sample items**.

---

## Shipping an update later

Small updates (code, photos, front-end; same `composer.lock`):

```bash
python scripts/make_update.py
```

It writes `deploy/lct-trading-update-<date>.zip` with only the files that changed
since the last upload. Upload it to the cPanel home directory (the folder holding
both `lct-trading/` and `public_html/`) and **Extract** there; it overwrites just
those files. Then run what the script prints (e.g. `php artisan migrate --force`
for a new migration) and `php artisan config:cache && php artisan view:clear`.
The script remembers what it shipped (`deploy/server-manifest.json`), so build
each update zip only when you're about to upload it.

Big updates (new packages in `composer.lock`), the full way:

```bash
python scripts/make_deploy.py
```

Then upload only what changed:
- **Code** (`app/`, `config/`, `resources/`, `routes/`, `database/migrations/`):
  extract `lct-trading-full-deploy.zip` over `~/lct-trading/` (it has no `.env`, so
  the live one is kept).
- **Front-end**: delete `public_html/build/`, then extract
  `lct-trading-public_html-ready.zip` over `public_html` (the asset filenames are
  content-hashed). Delete `_storage-link.php` again after extracting.
- **New migrations**: `php artisan migrate --force` in Terminal.
- Then `php artisan config:cache && php artisan view:clear`.

**Never re-import the SQL dump** on a live site — it replaces orders, prices and
stock with this PC's copy.

## Troubleshooting

| Symptom | Fix |
|---|---|
| 500 on first load | `chmod -R 775 ~/lct-trading/storage ~/lct-trading/bootstrap/cache`; then check `~/lct-trading/storage/logs/laravel.log` |
| White page, nothing in laravel.log | PHP version below 8.2, or a missing extension; check cPanel → **Errors** / the PHP error log |
| Page loads without styling | `APP_URL` wrong (http vs https), or `public_html/build/` missing |
| Admin-uploaded photos 404 | Step 5 link missing |
| Orders not emailed | Cron missing or wrong PHP path; `php artisan queue:failed` |

## Where things are

| What | Path |
|---|---|
| Compiled JS/CSS | `public_html/build/` |
| Product photos | `public_html/images/products/` |
| Admin uploads | `lct-trading/storage/app/public/uploads/` |
| Error log | `lct-trading/storage/logs/laravel.log` |
| Admin panel | `/admin` |
