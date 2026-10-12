<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Support\Seo;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        // Every number on the homepage is counted from the live catalog.
        $stats = Cache::remember(Product::cacheKey('home-stats'), 600, fn () => [
            'items'      => Product::active()->count(),
            'brands'     => Product::active()->distinct()->count('brand'),
            'categories' => Product::active()->whereNotNull('category')->distinct()->count('category'),
        ]);

        $categories = Cache::remember(Product::cacheKey('home-categories'), 600, fn () => Product::active()
            ->whereNotNull('category')
            ->selectRaw('category, count(*) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(function ($row) {
                // A real product photo from the category, not stock art.
                $pick = Product::active()->where('category', $row->category)->where('stock', '>', 0)
                    ->whereNotNull('image')->orderBy('brand_rank')->orderBy('id')->first();

                return [
                    'name'  => $row->category,
                    'count' => (int) $row->total,
                    'image' => $pick?->image,
                ];
            })->all());

        // Cache the file name, not the URL: a URL built for one host (127.0.0.1)
        // breaks when the site is opened through another (a tunnel, the live domain).
        $categories = array_map(
            fn ($c) => ['image' => $c['image'] ? (new Product(['image' => $c['image']]))->image_url : null] + $c,
            $categories,
        );

        $seo = new Seo(
            title: 'LCT Trading | Tools & Hardware Supplier in the Philippines',
            description: number_format($stats['items'])." tools and hardware items from {$stats['brands']} brands (Makita, Bosch, DeWalt, Royu, Omni, Ingco and more) with peso prices and stock. Order by SKU online; cash on delivery or bank deposit, delivery nationwide.",
            canonical: route('home'),
        );

        return Inertia::render('Home', [
            'seo'        => $seo->forPage(),
            'stats'      => $stats,
            // Only brands with a logo file go in the logo strip (the rest would 404).
            'brands'     => collect(CatalogController::brands())
                ->map(fn ($b) => $b + ['logo' => CatalogController::brandLogo($b['name'])])
                ->filter(fn ($b) => $b['logo'])
                ->values(),
            'categories' => $categories,
        ])->withViewData('seo', $seo);
    }

    /** Ordering, delivery and payment spelled out, with LCT's policies from Settings. */
    public function howToOrder(): Response
    {
        $faqs = Seo::orderingFaq();
        $seo = new Seo(
            title: 'How to Order Tools & Hardware Online | '.Seo::SITE,
            description: 'Order from LCT Trading in three steps: find items by SKU, send your tray, and LCT calls to confirm stock, the total and delivery. No account; cash on delivery or bank deposit; delivery nationwide or free pickup.',
            canonical: route('how-to-order'),
            schema: [Seo::faq($faqs), Seo::breadcrumbs([['Home', route('home')], ['How to order', route('how-to-order')]])],
        );

        return Inertia::render('HowToOrder', [
            'shipping'   => Order::SHIPPING,
            'payment'    => Order::PAYMENT,
            'pickupNote' => Setting::get('pickup_note'),
            'policies'   => CatalogController::tabs(),
            'faqs'       => $faqs,
            'seo'        => $seo->forPage(),
        ])->withViewData('seo', $seo);
    }

    public function contact(): Response
    {
        $seo = new Seo(
            title: 'Contact LCT Trading | Tools & Hardware Supplier',
            description: 'Call, email or message LCT Trading about an item, a bulk order or delivery. Send the SKU or a photo and we check stock and give you the total.',
            canonical: route('contact'),
            schema: [
                ['@type' => 'ContactPage', 'url' => route('contact'), 'about' => ['@id' => url('/').'#store']],
                Seo::breadcrumbs([['Home', route('home')], ['Contact', route('contact')]]),
            ],
        );

        return Inertia::render('Contact', ['seo' => $seo->forPage()])->withViewData('seo', $seo);
    }
}
