<?php

namespace App\Support;

use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Str;

/**
 * What search engines and AI crawlers read for a page.
 *
 * The site has no server-side React render, so crawlers that don't run
 * JavaScript (most AI bots) would otherwise get an empty page with the same
 * title everywhere. Each controller builds one of these; app.blade.php prints
 * the title, description, canonical, robots and JSON-LD in <head>, and a plain
 * HTML version of the page inside #app that React replaces when it loads.
 */
class Seo
{
    public const SITE = 'LCT Trading';

    public function __construct(
        public string $title,
        public string $description,
        public ?string $canonical = null,
        public bool $index = true,
        public ?string $image = null,
        public string $type = 'website',
        /** @var list<array> */
        public array $schema = [],
    ) {
        $this->description = Str::limit(trim(preg_replace('/\s+/', ' ', html_entity_decode(preg_replace('/<[^>]+>/', ' ', $description), ENT_QUOTES | ENT_HTML5))), 158, '…');
        $this->canonical ??= url()->current();
    }

    /** The bit the React side needs to keep <title> and the description in step. */
    public function forPage(): array
    {
        return ['title' => $this->title, 'description' => $this->description];
    }

    /** Store details from Admin → Settings, minus the "(set in admin)" placeholders. */
    public static function store(): array
    {
        $s = Setting::map();
        $real = fn ($v) => filled($v) && ! str_contains((string) $v, 'set in admin') ? trim((string) $v) : null;

        return [
            'phone'    => $real($s['phone'] ?? null),
            'email'    => $real($s['email'] ?? null),
            'address'  => $real($s['address'] ?? null),
            'hours'    => $real($s['hours'] ?? null),
            'facebook' => $real($s['facebook_url'] ?? null),
        ];
    }

    /** The business itself; on every page so answer engines tie the pages to one store. */
    public static function organization(): array
    {
        $store = self::store();

        return array_filter([
            '@type'       => 'HardwareStore',
            '@id'         => url('/').'#store',
            'name'        => self::SITE,
            'description' => 'Tools and hardware supplier in the Philippines: power tools, hand tools, electrical and lighting, plumbing, paint supplies and general hardware. Order online by SKU; LCT confirms stock and delivery by phone. Cash on delivery or bank deposit.',
            'url'         => url('/'),
            'logo'        => asset('images/lct-logo.webp'),
            'image'       => asset('images/og.jpg'),
            'telephone'   => $store['phone'],
            'email'       => $store['email'],
            'address'     => $store['address'] ? ['@type' => 'PostalAddress', 'streetAddress' => $store['address'], 'addressCountry' => 'PH'] : null,
            'openingHours' => $store['hours'],
            'areaServed'  => ['@type' => 'Country', 'name' => 'Philippines'],
            'currenciesAccepted' => 'PHP',
            'paymentAccepted' => 'Cash on delivery, Bank deposit',
            'sameAs'      => $store['facebook'] ? [$store['facebook']] : null,
        ]);
    }

    public static function website(): array
    {
        return [
            '@type' => 'WebSite',
            '@id' => url('/').'#website',
            'name' => self::SITE,
            'url' => url('/'),
            'publisher' => ['@id' => url('/').'#store'],
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => route('catalog').'?q={search_term_string}',
                'query-input' => 'required name=search_term_string',
            ],
        ];
    }

    /** @param list<array{0: string, 1: string}> $crumbs [name, url] */
    public static function breadcrumbs(array $crumbs): array
    {
        return [
            '@type' => 'BreadcrumbList',
            'itemListElement' => array_map(fn ($c, $i) => ['@type' => 'ListItem', 'position' => $i + 1, 'name' => $c[0], 'item' => $c[1]], $crumbs, array_keys($crumbs)),
        ];
    }

    public static function product(Product $p): array
    {
        $images = array_values(array_filter([$p->image_url, ...array_map(Product::photoUrl(...), $p->ownGallery())]));

        return array_filter([
            '@type' => 'Product',
            'name' => $p->name,
            'sku' => $p->sku,
            'mpn' => $p->sku,
            'brand' => ['@type' => 'Brand', 'name' => $p->brand],
            'category' => $p->category,
            'image' => $images ?: null,
            'description' => self::productSummary($p),
            'url' => route('product', $p->sku),
            'offers' => [
                '@type' => 'Offer',
                'url' => route('product', $p->sku),
                'priceCurrency' => 'PHP',
                'price' => number_format($p->salePrice(), 2, '.', ''),
                'availability' => $p->stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                'itemCondition' => 'https://schema.org/NewCondition',
                'priceValidUntil' => now()->addMonth()->endOfMonth()->toDateString(),
                'seller' => ['@id' => url('/').'#store'],
                'areaServed' => 'PH',
            ],
        ]);
    }

    /**
     * One plain, factual paragraph for items without their own description
     * (most supplier items), so every product page says what it is, what it
     * costs and how to get it.
     */
    public static function productSummary(Product $p): string
    {
        $price = '₱'.number_format($p->salePrice(), 2);
        $stock = $p->stock > 0 ? 'in stock' : 'currently out of stock';
        $type = $p->type ? Str::lower($p->type) : Str::lower((string) $p->category);

        return "{$p->name} (SKU {$p->sku}) is a {$p->brand} {$type} sold by LCT Trading in the Philippines for {$price}, {$stock}. "
            .'Order it online with no account; LCT confirms stock, the total and delivery by phone. Pay cash on delivery or by bank deposit; store pickup is free.';
    }

    /** @param list<array{q: string, a: string}> $faqs */
    public static function faq(array $faqs): array
    {
        return [
            '@type' => 'FAQPage',
            'mainEntity' => array_map(fn ($f) => [
                '@type' => 'Question',
                'name' => $f['q'],
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => $f['a']],
            ], $faqs),
        ];
    }

    /** The JSON-LD graph for <head>: the store and site on every page, plus the page's own items. */
    public function jsonLd(): string
    {
        return json_encode(
            ['@context' => 'https://schema.org', '@graph' => [self::organization(), self::website(), ...$this->schema]],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG,
        );
    }

    /** Ordering questions, shared by the How-to-order page, its FAQ schema and llms.txt. */
    public static function orderingFaq(): array
    {
        $note = Setting::get('price_note') ?: "Prices are subject to LCT's confirmation. Bulk discounts may be approved when we contact you.";

        return [
            ['q' => 'Do I need an account to order from LCT Trading?', 'a' => 'No. Add items to your tray, then give your name, phone and address at checkout.'],
            ['q' => 'Is the price on the site final?', 'a' => $note.' The delivery fee is confirmed on the same call.'],
            ['q' => 'How do I pay?', 'a' => 'Nothing is charged online. Pay cash on delivery, or by bank deposit once LCT confirms your order.'],
            ['q' => 'Do you deliver anywhere in the Philippines?', 'a' => 'Yes: standard courier nationwide (3–10 days), same-day Lalamove in Metro Manila, cargo/freight, or LCT local delivery. Store pickup is free.'],
            ['q' => 'Can I order in bulk?', 'a' => 'Yes. Use list view in the shop to type quantities row by row. Larger orders may get a bulk discount when LCT calls to confirm.'],
            ['q' => 'What if an item is out of stock?', 'a' => 'Stock is shown on every item. Out-of-stock items cannot be sent; if you ask for more than is on hand, LCT tells you when it calls.'],
            ['q' => 'How do I follow up on my order?', 'a' => 'Right after you send it you get a reference number (it starts with LCT-). Quote it when you call or message LCT.'],
        ];
    }
}
