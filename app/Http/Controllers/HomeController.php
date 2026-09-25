<?php

namespace App\Http\Controllers;

use App\Models\Product;
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
                    'image' => $pick?->image_url,
                ];
            })->all());

        return Inertia::render('Home', [
            'stats'      => $stats,
            'brands'     => CatalogController::brands(),
            'categories' => $categories,
        ]);
    }
}
