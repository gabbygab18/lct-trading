<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Support\Gallery;
use App\Support\SafeHtml;
use App\Support\Seo;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    private const SORTS = ['featured', 'price_asc', 'price_desc', 'name'];

    public function index(Request $request): Response
    {
        $filters = [
            'q'        => Str::limit(trim((string) $request->query('q', '')), 100, ''),
            'brand'    => (string) $request->query('brand', ''),
            'category' => (string) $request->query('category', ''),
            'sort'     => in_array($request->query('sort'), self::SORTS, true) ? $request->query('sort') : 'featured',
        ];

        // Only real brands and categories: anything else would just be another
        // empty listing to cache.
        if ($filters['brand'] !== '' && ! in_array($filters['brand'], array_column(self::brands(), 'name'), true)) {
            $filters['brand'] = '';
        }
        if ($filters['category'] !== '' && ! in_array($filters['category'], self::categoryNames(), true)) {
            $filters['category'] = '';
        }

        $query = Product::active()
            ->search($filters['q'])
            ->when($filters['brand'], fn ($q, $b) => $q->where('brand', $b))
            ->when($filters['category'], fn ($q, $c) => $q->where('category', $c));

        // Someone typing a code wants that code first.
        if ($filters['q'] !== '' && $filters['sort'] === 'featured') {
            $term = addcslashes($filters['q'], '%_\\');
            $query->orderByRaw('case when sku = ? then 0 when sku like ? then 1 else 2 end', [$filters['q'], $term.'%']);
        }

        match ($filters['sort']) {
            'price_asc'  => $query->orderByRaw(Product::SALE_PRICE_SQL)->orderBy('name'),
            'price_desc' => $query->orderByRaw(Product::SALE_PRICE_SQL.' desc')->orderBy('name'),
            'name'       => $query->orderBy('name'),
            // In stock first, then the client's brand order.
            default      => $query->orderByRaw('stock > 0 desc')->orderBy('brand_rank')->orderBy('name'),
        };

        // The same listing is asked for again and again (the shop's first page,
        // each brand, popular searches): keep each page for 10 minutes. Raw rows
        // are cached, not cards, so URLs are built for whichever host is asking.
        $page = max(1, (int) $request->query('page', 1));
        $perPage = (int) config('catalog.per_page');
        // Searches aren't cached: anyone can type endless different ones.
        $fetch = function () use ($query, $page, $perPage) {
            $found = $query
                ->select(['id', 'sku', 'name', 'brand', 'category', 'price', 'discount_percent', 'stock', 'image'])
                ->paginate($perPage, page: $page);

            return [$found->getCollection()->map->getAttributes()->all(), $found->total()];
        };
        [$rows, $total] = $filters['q'] !== '' || $page > 200
            ? $fetch()
            : Cache::remember(Product::cacheKey('shop:'.json_encode($filters).':'.$page), 600, $fetch);
        $products = new LengthAwarePaginator(
            Product::hydrate($rows)->map(fn (Product $p) => self::card($p)),
            $total, $perPage, $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        // Categories follow the chosen brand so the list never offers a dead end.
        $categories = Cache::remember(Product::cacheKey('categories:'.$filters['brand']), 600, fn () => Product::active()
            ->when($filters['brand'], fn ($q, $b) => $q->where('brand', $b))
            ->whereNotNull('category')
            ->selectRaw('category, count(*) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['name' => $r->category, 'count' => (int) $r->total]));

        $intro = self::intro($filters);
        $seo = self::listingSeo($filters, $products, $intro);

        return Inertia::render('Catalog', [
            'products'   => $products,
            'filters'    => $filters,
            'brands'     => self::brands(),
            'categories' => $categories,
            'seo'        => $seo->forPage(),
            'intro'      => $intro,
        ])->withViewData('seo', $seo);
    }

    /**
     * Brand and category pages open with a short, dated price-list summary and
     * a few answers, all counted from the live catalog, so the page states
     * plainly what LCT has and what it costs (what answer engines quote).
     */
    private static function intro(array $filters): ?array
    {
        [$brand, $category] = [$filters['brand'], $filters['category']];
        if ($filters['q'] !== '' || ($brand === '') === ($category === '')) {
            return null; // only brand-only or category-only pages
        }

        $facts = Cache::remember(Product::cacheKey('intro:'.$brand.'|'.$category), 3600, function () use ($brand, $category) {
            $base = Product::active()->when($brand, fn ($q) => $q->where('brand', $brand))->when($category, fn ($q) => $q->where('category', $category));
            $row = (clone $base)->selectRaw('count(*) n, sum(case when stock > 0 then 1 else 0 end) instock, min('.Product::SALE_PRICE_SQL.') lo, max('.Product::SALE_PRICE_SQL.') hi')->first();
            $col = $brand ? 'category' : 'brand';
            $top = (clone $base)->whereNotNull($col)->selectRaw("{$col}, count(*) n")
                ->groupBy($col)->orderByDesc('n')->limit(5)->pluck($col)->all();

            return ['n' => (int) $row->n, 'instock' => (int) $row->instock, 'lo' => (float) $row->lo, 'hi' => (float) $row->hi, 'top' => $top];
        });
        if (! $facts['n']) {
            return null;
        }

        $name = $brand ?: $category;
        $peso = fn ($v) => '₱'.number_format($v, 2);
        $range = $facts['lo'] == $facts['hi'] ? $peso($facts['lo']) : $peso($facts['lo']).' to '.$peso($facts['hi']);
        $top = implode(', ', $facts['top']);
        $updated = now()->timezone('Asia/Manila')->format('F Y');
        $count = number_format($facts['n']);

        $text = $brand
            ? "LCT Trading carries {$count} {$brand} items in the Philippines, from {$range}, with ".number_format($facts['instock'])." in stock now. Most are {$top}. Prices are in pesos and updated as stock changes; order online by SKU and LCT confirms the total and delivery by phone."
            : "{$count} {$category} items at LCT Trading, from {$range}, with ".number_format($facts['instock'])." in stock now, from brands such as {$top}. Prices are in pesos and updated as stock changes; order online by SKU and LCT confirms the total and delivery by phone.";

        $faqs = [
            ['q' => "How much are {$name} items at LCT Trading?", 'a' => "Prices run from {$range} across {$count} items, as of {$updated}. Each item page shows its current peso price and stock."],
            ['q' => "Magkano ang {$name} sa LCT Trading?", 'a' => "Mula {$range} ang presyo ng {$count} items, as of {$updated}. Nasa bawat item ang presyo at stock."],
            ['q' => "Where can I buy {$name} in the Philippines?", 'a' => "Order from LCT Trading online: add items to your tray and send the order. LCT confirms stock, the total and delivery by phone; delivery nationwide by courier, same-day Lalamove in Metro Manila, or free store pickup."],
            ['q' => 'Can I pay cash on delivery?', 'a' => 'Yes. Nothing is charged online: pay cash on delivery, or by bank deposit once LCT confirms your order.'],
        ];

        return ['heading' => "{$name} Price List Philippines", 'text' => $text, 'updated' => $updated, 'faqs' => $faqs];
    }

    /** /brands/makita: the Makita listing at a clean, indexable address. */
    public function brand(Request $request, string $slug): Response
    {
        $name = collect(self::brands())->pluck('name')->first(fn ($b) => Str::slug($b) === $slug);
        abort_unless($name, 404);
        $request->query->set('brand', $name);

        return $this->index($request);
    }

    /** /categories/electrical-lighting: the same for a category. */
    public function category(Request $request, string $slug): Response
    {
        $name = collect(self::categoryNames())->first(fn ($c) => Str::slug($c) === $slug);
        abort_unless($name, 404);
        $request->query->set('category', $name);

        return $this->index($request);
    }

    /** @return list<string> */
    public static function categoryNames(): array
    {
        return Cache::remember(Product::cacheKey('category-names'), 3600, fn () => Product::active()
            ->whereNotNull('category')->distinct()->orderBy('category')->pluck('category')->all());
    }

    /**
     * Titles and canonicals for listings. Brand-only and category-only pages
     * point at their clean URL; searches, sorts and page 2+ aren't indexed
     * (they repeat what the clean pages already list).
     */
    private static function listingSeo(array $filters, LengthAwarePaginator $products, ?array $intro = null): Seo
    {
        [$brand, $category, $q] = [$filters['brand'], $filters['category'], $filters['q']];
        $page = $products->currentPage();
        $count = number_format($products->total());

        $canonical = match (true) {
            $brand !== '' && $category === '' => route('brand', Str::slug($brand)),
            $category !== '' && $brand === '' => route('category', Str::slug($category)),
            $brand !== '' => route('catalog', ['brand' => $brand, 'category' => $category]),
            default => route('catalog'),
        };
        $index = $q === '' && $filters['sort'] === 'featured' && $page === 1;

        [$title, $description] = match (true) {
            $q !== '' => ["Search “{$q}” | ".Seo::SITE, "{$count} items matching “{$q}” at LCT Trading: prices, stock and SKUs."],
            $brand !== '' && $category !== '' => ["{$brand} {$category} Price List Philippines | ".Seo::SITE,
                "{$count} {$brand} {$category} items with prices in pesos and stock. Order online from LCT Trading; delivery nationwide or store pickup."],
            $brand !== '' => ["{$brand} Price List Philippines: Tools & Hardware | ".Seo::SITE,
                "Shop {$count} {$brand} items at LCT Trading with up-to-date peso prices, SKUs and stock. Order online, pay cash on delivery or bank deposit; delivery nationwide."],
            $category !== '' => ["{$category} Price List Philippines | ".Seo::SITE,
                "{$count} {$category} items from Makita, Bosch, Royu, Omni, Ingco and more, with peso prices and stock. Order online from LCT Trading."],
            default => ['Shop Tools & Hardware Online Philippines | '.Seo::SITE,
                "Browse {$count} tools and hardware items by brand, category or SKU. Peso prices and stock on every item; LCT confirms your order by phone."],
        };

        $crumbs = [['Home', route('home')], ['Shop', route('catalog')]];
        if ($brand !== '') {
            $crumbs[] = [$brand, route('brand', Str::slug($brand))];
        }
        if ($category !== '') {
            $crumbs[] = [$category, $brand === '' ? route('category', Str::slug($category)) : $canonical];
        }

        return new Seo(
            title: $page > 1 ? "{$title} – Page {$page}" : $title,
            description: $description,
            canonical: $canonical,
            index: $index,
            schema: [
                Seo::breadcrumbs($crumbs),
                ...($intro && $page === 1 ? [Seo::faq($intro['faqs'])] : []),
                [
                    '@type' => 'ItemList',
                    'numberOfItems' => $products->total(),
                    'itemListElement' => $products->getCollection()->values()->map(fn ($p, $i) => [
                        '@type' => 'ListItem', 'position' => $i + 1, 'url' => $p['url'], 'name' => $p['name'],
                    ])->all(),
                ],
            ],
        );
    }

    public function show(Product $product): Response
    {
        abort_unless($product->is_active, 404);

        // Same category first, then same brand; in stock only. Cached: the query
        // sorts every item in the category or brand.
        $related = Product::hydrate(Cache::remember(Product::cacheKey('related:'.$product->id), 3600, fn () => Product::active()
            ->where('stock', '>', 0)->whereKeyNot($product->id)
            ->where(fn ($q) => $q->where('category', $product->category)->orWhere('brand', $product->brand))
            ->orderByRaw('case when category = ? and brand = ? then 0 when category = ? then 1 else 2 end', [$product->category, $product->brand, $product->category])
            ->orderBy('brand_rank')
            ->limit(5)
            ->get()
            ->map->getAttributes()
            ->all()));

        $crumbs = [['Home', route('home')], ['Shop', route('catalog')], [$product->brand, route('brand', Str::slug($product->brand))]];
        if ($product->category) {
            $crumbs[] = [$product->category, route('category', Str::slug($product->category))];
        }
        $crumbs[] = [$product->name, route('product', $product->sku)];
        $seo = new Seo(
            // "{model} … Price Philippines": how people search for a specific item.
            title: Str::limit($product->name, 62, '…').' Price Philippines | '.Seo::SITE,
            description: SafeHtml::description($product->description) ?: Seo::productSummary($product),
            canonical: route('product', $product->sku),
            // Sample items copied from a public feed: not LCT's own listing, so kept out of search.
            index: ! $product->is_placeholder,
            image: $product->image_url,
            type: 'product',
            schema: [Seo::breadcrumbs($crumbs), Seo::product($product)],
        );

        return Inertia::render('Product', [
            'product' => self::card($product) + [
                // Items without their own text get the plain summary, so the page
                // (and what crawlers read) always says what it is and how to get it.
                'description' => SafeHtml::description($product->description) ?: '<p>'.e(Seo::productSummary($product)).'</p>',
                'gallery'     => Gallery::urls($product),
                // Keep "LED Bulb" as printed; only tidy all-lowercase ones ("breaker panel").
                'type'        => $product->type ? ($product->type === Str::lower($product->type) ? Str::title($product->type) : $product->type) : null,
                'tags'        => array_values((array) $product->tags),
                'brandLogo'   => self::brandLogo($product->brand),
            ],
            'related' => $related->map(fn (Product $p) => self::card($p)),
            'tabs'    => self::tabs(),
            'pickupNote' => Setting::get('pickup_note'),
            'seo'     => $seo->forPage(),
        ])->withViewData('seo', $seo);
    }

    /**
     * LCT's own policy text for the product-page tabs, from Admin → Settings.
     * Shipping falls back to what the checkout actually offers.
     *
     * @return list<array{key: string, label: string, html: string}>
     */
    public static function tabs(): array
    {
        $shipping = '<p>Choose at checkout: '.e(implode('; ', Order::SHIPPING)).'.</p>'
            .'<p>The delivery fee depends on weight and distance. LCT confirms it with you by phone before anything ships. Store pickup is free.</p>';

        return collect([
            'warranty'    => ['Warranty & service', Setting::get('policy_warranty')],
            'shipping'    => ['Shipping & delivery', Setting::get('policy_shipping') ?: $shipping],
            'returns'     => ['Returns', Setting::get('policy_returns')],
            'price_match' => ['Price match', Setting::get('policy_price_match')],
            'repair'      => ['Repair', Setting::get('policy_repair')],
            'per_order'   => ['Per order', Setting::get('policy_per_order')],
        ])
            ->map(fn ($tab, $key) => ['key' => $key, 'label' => $tab[0], 'html' => SafeHtml::description($tab[1])])
            ->filter(fn ($tab) => $tab['html'])
            ->values()
            ->all();
    }

    /** The fields every product card and the tray need. */
    public static function card(Product $p): array
    {
        return [
            'id'       => $p->id,
            'sku'      => $p->sku,
            'name'     => $p->name,
            'brand'    => $p->brand,
            'category' => $p->category,
            'price'    => $p->salePrice(),
            'listPrice' => $p->hasDiscount() ? (float) $p->price : null,
            'discount' => $p->hasDiscount() ? (float) $p->discount_percent : 0,
            'stock'    => $p->stock,
            'image'    => $p->image_url,
            'url'      => route('product', $p->sku),
        ];
    }

    public static function brandLogo(string $brand): ?string
    {
        $file = 'images/brands/'.preg_replace('/[^a-z0-9]/', '', strtolower($brand)).'.webp';

        return is_file(public_path($file)) ? asset($file).'?v=2' : null;
    }

    /** @return list<array{name: string, count: int, top: bool}> top: the shop's popular brands (config). */
    public static function brands(): array
    {
        $top = array_map('strtolower', config('catalog.priority_brands'));

        return Cache::remember(Product::cacheKey('brands-v2'), 600, fn () => Product::active()
            ->selectRaw('brand, min(brand_rank) as rank_, count(*) as total')
            ->groupBy('brand')
            ->orderBy('rank_')
            ->orderBy('brand')
            ->get()
            ->map(fn ($r) => ['name' => $r->brand, 'count' => (int) $r->total, 'top' => in_array(strtolower($r->brand), $top, true)])
            ->all());
    }
}
