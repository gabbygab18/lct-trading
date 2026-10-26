<?php

namespace App\Http\Middleware;

use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    /** The admin is its own React app (lct-stocks' look), with its own page shell. */
    public function rootView(Request $request): string
    {
        return $this->isAdmin($request) ? 'admin.app' : $this->rootView;
    }

    private function isAdmin(Request $request): bool
    {
        return $request->is('admin', 'admin/*');
    }

    public function share(Request $request): array
    {
        if ($this->isAdmin($request)) {
            return array_merge(parent::share($request), [
                'auth' => ['user' => $request->user()?->only('id', 'name', 'email')],
                'flash' => [
                    'success' => fn () => $request->session()->get('success'),
                    'error'   => fn () => $request->session()->get('error'),
                ],
                // Sidebar badges: orders to confirm, inquiries not yet opened.
                'counts' => fn () => $request->user() ? [
                    'orders'    => \App\Models\Order::where('status', 'pending')->count(),
                    'inquiries' => \App\Models\Inquiry::where('is_read', false)->count(),
                ] : null,
                'shopUrl' => route('catalog'),
            ]);
        }

        $settings = Setting::map();

        return array_merge(parent::share($request), [
            // Only what the public pages show. Never the whole settings map.
            'store' => [
                'phone'    => $settings['phone'] ?? null,
                'viber'    => $settings['viber'] ?? null,
                'email'    => $settings['email'] ?? null,
                'address'  => $settings['address'] ?? null,
                'hours'    => $settings['hours'] ?? null,
                'facebook' => $settings['facebook_url'] ?? null,
                'bank'     => $settings['bank_details'] ?? null,
                // Shown under every price and total. Blank in Settings = this default.
                'priceNote' => ($settings['price_note'] ?? null) ?: "Prices are subject to LCT's confirmation. Bulk discounts may be approved when we contact you.",
            ],
            // elnovian's Header/Footer/Frap/ContactBlock read these names.
            'settings' => [
                'phone'        => $settings['phone'] ?? null,
                'email'        => $settings['email'] ?? null,
                'address'      => $settings['address'] ?? null,
                'facebook_url' => $settings['facebook_url'] ?? null,
            ],
            'navBrands' => fn () => \App\Http\Controllers\CatalogController::brands(),
            'isHome'    => $request->routeIs('home'),
            'routes' => [
                'home'     => route('home'),
                'catalog'  => route('catalog'),
                'howTo'    => route('how-to-order'),
                'contact'  => route('contact'),
                'checkout' => route('checkout'),
                'orders'   => route('orders.store'),
                'inquiries' => route('inquiries.store'),
                'suggest'   => route('search.suggest'),
            ],
            'maxQuantity' => config('catalog.max_quantity'),
            'flash' => ['inquirySent' => fn () => $request->session()->get('inquiry_sent')],
            'inquiryTopics' => \App\Models\Inquiry::TOPICS,
            'turnstileSiteKey' => config('services.turnstile.site_key'),
            'lowStock'    => fn () => Product::lowStockThreshold(),
        ]);
    }
}
