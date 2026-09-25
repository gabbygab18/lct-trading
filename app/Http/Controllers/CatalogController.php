<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Support\GalleryCache;
use App\Support\SafeHtml;
use Illuminate\Http\Request;
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
            'q'        => trim((string) $request->query('q', '')),
            'brand'    => (string) $request->query('brand', ''),
            'category' => (string) $request->query('category', ''),
            'sort'     => in_array($request->query('sort'), self::SORTS, true) ? $request->query('sort') : 'featured',
        ];

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

        $products = $query
            ->select(['id', 'sku', 'name', 'brand', 'category', 'price', 'discount_percent', 'stock', 'image'])
            ->paginate(config('catalog.per_page'))
            ->withQueryString()
            ->through(fn (Product $p) => self::card($p));

        // Categories follow the chosen brand so the list never offers a dead end.
        $categories = Cache::remember(Product::cacheKey('categories:'.$filters['brand']), 600, fn () => Product::active()
            ->when($filters['brand'], fn ($q, $b) => $q->where('brand', $b))
            ->whereNotNull('category')
            ->selectRaw('category, count(*) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['name' => $r->category, 'count' => (int) $r->total]));

        return Inertia::render('Catalog', [
            'products'   => $products,
            'filters'    => $filters,
            'brands'     => self::brands(),
            'categories' => $categories,
        ]);
    }

    public function show(Product $product): Response
    {
        abort_unless($product->is_active, 404);

        // Same category first, then same brand; in stock only.
        $related = Product::active()->where('stock', '>', 0)->whereKeyNot($product->id)
            ->where(fn ($q) => $q->where('category', $product->category)->orWhere('brand', $product->brand))
            ->orderByRaw('case when category = ? and brand = ? then 0 when category = ? then 1 else 2 end', [$product->category, $product->brand, $product->category])
            ->orderBy('brand_rank')
            ->limit(5)
            ->get();

        return Inertia::render('Product', [
            'product' => self::card($product) + [
                'description' => SafeHtml::description($product->description),
                'gallery'     => GalleryCache::urls($product),
                // Keep "LED Bulb" as printed; only tidy all-lowercase ones ("breaker panel").
                'type'        => $product->type ? ($product->type === Str::lower($product->type) ? Str::title($product->type) : $product->type) : null,
                'tags'        => array_values((array) $product->tags),
                'brandLogo'   => self::brandLogo($product->brand),
            ],
            'related' => $related->map(fn (Product $p) => self::card($p)),
            'tabs'    => self::tabs(),
            'pickupNote' => Setting::get('pickup_note'),
        ]);
    }

    /**
     * LCT's own policy text for the product-page tabs, from Admin → Settings.
     * Shipping falls back to what the checkout actually offers.
     *
     * @return list<array{key: string, label: string, html: string}>
     */
    private static function tabs(): array
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

    /** @return list<array{name: string, count: int}> */
    public static function brands(): array
    {
        return Cache::remember(Product::cacheKey('brands'), 600, fn () => Product::active()
            ->selectRaw('brand, min(brand_rank) as rank_, count(*) as total')
            ->groupBy('brand')
            ->orderBy('rank_')
            ->orderBy('brand')
            ->get()
            ->map(fn ($r) => ['name' => $r->brand, 'count' => (int) $r->total])
            ->all());
    }
}
