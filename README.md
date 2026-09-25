# LCT Trading · product catalog & order requests

Customers search by name or SKU, add items to a tray straight from the list and send an order request. No online payment: every order is emailed to the store and lands in the admin, where staff confirm by phone.

Laravel 12 + Inertia + React (public site), Blade (admin), Tailwind v4. Same layout as the elnovian-react-laravel project.

## Run locally

```bash
composer install
npm install
cp .env.example .env && php artisan key:generate
python scripts/fetch_khm_feed.py      # sample catalog + photos (see below), ~10 min first time
php artisan migrate --seed            # prints the admin password once
npm run build
php artisan serve                     # http://127.0.0.1:8000, admin at /admin
```

`php artisan test` covers ordering, stock deduction on confirm, and the bulk import.

## Sample catalog (placeholder)

`scripts/fetch_khm_feed.py` pulls the 14 priority brands (Royu, Omni, Makita, Powerhouse, Wadfow, Ingco, Bosch, DeWalt, Jackson, Meco, Butterfly, Stanley, Ridgid, Sanwa) from khmtools.com.ph's public product feed so the site can be previewed with real-looking data: ~15.6k SKUs, ~8.6k photos (158 MB).

These rows are **placeholders**, marked "Sample" in the admin. The quotation commits that LCT's live listings are not copied from another store: before go-live, upload LCT's own list at **Admin → Excel / CSV upload**, then press **Remove sample items**. Prices, SKUs where the feed had none (`LCT-…`), stock (20 / 0) and categories are all approximations.

## Admin

- **Orders**: pending → confirmed (stock is deducted; refused if stock is short) → completed. Cancelling a confirmed order returns the stock.
- **Items**: price and stock are editable right in the list. Low-stock threshold is in Settings.
- **Excel / CSV upload**: `.xlsx` or `.csv`, matched by `sku`. Only the columns present are written, so `sku,price` is a price update. Template and full export are on the same page.
- **Settings**: order email, phone, address, hours, bank deposit details. The seeded values are visible placeholders.

## Deploy (cPanel, same as elnovian)

1. Upload the app outside `public_html`, the contents of `public/` inside it; point `public_html/index.php` at the app folder.
2. `.env`: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, MySQL `DB_*`, SMTP `MAIL_*`, `ORDER_MAIL_TO` (fallback when Settings email is blank).
3. `php artisan migrate --force && php artisan db:seed --force && php artisan storage:link`
4. Cron, every minute: `php /home/USER/lct-trading/artisan schedule:run >> /dev/null 2>&1` (sends queued order emails).
5. Node isn't needed on the server; ship `public/build/`.
# lct-trading
