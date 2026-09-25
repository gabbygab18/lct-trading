# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Laravel 12 + Inertia + React + Tailwind, mirroring the developer's reference project `elnovian-react-laravel` (public site in React via Inertia, admin panel in Blade). MySQL in production (shared hosting), SQLite acceptable for local dev.

## Users

Mixed buyers of LCT Trading, a tools and hardware supplier in the Philippines:
- Contractors, builders and repeat buyers who know the brand and often the SKU, order in quantity, and want to get the order in fast (often on a phone, on site).
- Walk-in / DIY customers who browse by brand or category and are less SKU-literate.

Secondary: the store owner/staff (client: Cliff Tan) who manage items, prices, stock and incoming orders in the admin panel.

## Product Purpose

Online product catalog + order request. Customers find items by name/SKU/brand/category, see price and stock, set quantity and add to cart straight from the list, and send the order with contact and delivery details. No online payment. Every order goes to the store by email and into the admin; staff call/message the customer to confirm availability, payment and delivery. Success = an order request reaches the store in as few steps as possible, with an order reference number shown to the customer.

## Positioning

A lean ordering tool, not a full e-commerce storefront. Flow is patterned after khmtools.com.ph's product listing and checkout (contact, delivery ship/pickup, PH address with barangay, shipping preference, COD / bank deposit preference) but stripped to: find item, add to cart, send order.

## Operating Context

- Philippine context: peso pricing (₱), barangay/city/region address fields, COD and bank deposit common, couriers like Gogo Express / Lalamove / cargo forwarders, store pickup.
- Staff confirm every order manually; payment and delivery fee are settled offline.
- Catalog maintained by staff via admin CRUD and Excel/CSV bulk upload.

## Capabilities and Constraints

From the signed quotation (Product Catalog Website Quotation.pdf):
- Catalog: name, SKU, price, category (brand), optional photo; instant search by name/SKU, category filter, sort by price.
- Quantity selector + Add to Cart on the list itself.
- Cart: running total, edit quantity, remove.
- Order form: name, contact number, email (optional), delivery address, notes. Email notification to store with full summary; on-screen confirmation with order reference number.
- Admin with secure login: item CRUD, price updates, Excel/CSV bulk upload/update, orders (pending / confirmed / completed).
- Inventory: stock per item, auto-deduct on order confirmation, Out of Stock label, low-stock alerts.
- Mobile-responsive, fast; basic SEO.
- NOT included: online payment, customer accounts, order tracking, delivery fee computation, blog/promo pages.

Priority brands (client instruction, SKU priority): Royu, Omni, Makita, Powerhouse, Wadfow, Ingco, Bosch, DeWalt, Jackson, Meco, Butterfly, Stanley, Ridgid, Sanwa.

## Brand Commitments

- Name: LCT Trading — "Tools & Hardware Supply".
- Logo: `image.png` — black hexagon (nut form), brushed-steel/silver LCT letterforms, red chevron, red rule under a heavy condensed wordmark, wide-tracked subline. Logo colors (black, steel grey, signal red) are the binding basis for the palette.

## Evidence on Hand

- Logo: `image.png`.
- Seed catalog: products for the 14 priority brands pulled from khmtools.com.ph's public product feed. PLACEHOLDER ONLY — the quotation commits that listings/images are not copied from other stores; client supplies real names, SKUs, prices and photos, imported via CSV before go-live. Seeded rows are flagged as placeholder in admin.
- Store address, phone, order-receiving email, social links: NOT supplied yet — placeholders in admin Settings. Do not invent testimonials, years in business, customer counts, or delivery promises.

## Product Principles

1. Speed to order beats browsing delight: search/SKU entry and add-to-cart are always within reach.
2. Tell the truth about stock and price; never imply payment happens online.
3. Staff time is the bottleneck: admin must make price/stock updates and order triage fast.
4. Works on a cheap phone on mobile data.

## Accessibility & Inclusion

WCAG AA contrast, keyboard-operable cart and forms, labelled inputs; English UI (Filipino-friendly plain wording).
