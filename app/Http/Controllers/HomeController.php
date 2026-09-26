<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
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

        return Inertia::render('Home', [
            'stats'      => $stats,
            // Only brands with a logo file go in the logo strip (the rest would 404).
            'brands'     => collect(CatalogController::brands())
                ->map(fn ($b) => $b + ['logo' => CatalogController::brandLogo($b['name'])])
                ->filter(fn ($b) => $b['logo'])
                ->values(),
            'categories' => $categories,
        ]);
    }

    /** Ordering, delivery and payment spelled out, with LCT's policies from Settings. */
    public function howToOrder(): Response
    {
        return Inertia::render('HowToOrder', [
            'shipping'   => Order::SHIPPING,
            'payment'    => Order::PAYMENT,
            'pickupNote' => Setting::get('pickup_note'),
            'policies'   => CatalogController::tabs(),
        ]);
    }

    public function contact(): Response
    {
        return Inertia::render('Contact');
    }
}
