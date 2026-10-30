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

    public function privacy(): Response
    {
        $seo = new Seo(
            title: 'Privacy Policy | '.Seo::SITE,
            description: 'What LCT Trading collects when you send an order or a message, how it is used, and how the Sahara Stocks inventory system handles Google Sheets access.',
            canonical: route('privacy'),
        );

        return Inertia::render('Privacy', ['seo' => $seo->forPage(), 'updated' => self::PRIVACY_UPDATED, 'sections' => self::privacySections()])
            ->withViewData('seo', $seo);
    }

    public const PRIVACY_UPDATED = 'October 30, 2026';

    /** The policy as plain paragraphs, shared by the page and the crawler fallback. */
    public static function privacySections(): array
    {
        return [
            ['Who we are', [
                'This website, lcttrading.com, is run by LCT Trading, a tools and hardware supplier in the Philippines. This policy also covers Sahara Stocks, the inventory system our staff use on lcttrading.com subdomains.',
            ]],
            ['What we collect on this website', [
                'When you send an order request: your name, phone number, email address, delivery address, the items in your tray and any notes you add.',
                'When you send a message through the contact form: your name, phone number, email address, the topic and your message.',
                'There are no customer accounts and nothing is paid online, so we never ask for or store card or bank details. Your tray is kept in your own browser until you send it.',
            ]],
            ['How we use it', [
                'Only to confirm stock, the total and delivery for your order, to reply to your message, and to send you a copy by email. We do not sell your details or use them for advertising.',
            ]],
            ['Who else sees it', [
                'Our staff. Cloudflare, which protects and serves this website and runs the anti-spam check on our forms. Our email provider, which delivers order and message emails. For deliveries, the courier gets the name, phone number and address needed to deliver.',
            ]],
            ['Sahara Stocks and Google user data', [
                'Sahara Stocks can keep the store’s inventory Google Sheet in step with the system. An administrator connects their own Google account and chooses the spreadsheet.',
                'With that permission, Sahara Stocks reads and edits the chosen spreadsheet (Google Sheets access) and reads the email address of the connected Google account, only to show which account is connected. It does not open any other file.',
                'The sheet data is used only to sync items, stock movements and low-stock limits between Sahara Stocks and that spreadsheet. It is not sold, not shared with anyone else, not used for advertising and not used to train AI models. People do not read it except to support the store or when the law requires it.',
                'The Google access token is stored encrypted on our server. Disconnecting in Sahara Stocks (Settings) deletes it and returns the permission to Google. You can also remove access at any time at myaccount.google.com/permissions.',
                'Sahara Stocks’ use and transfer of information received from Google APIs to any other app will adhere to the Google API Services User Data Policy, including the Limited Use requirements.',
            ]],
            ['How long we keep it', [
                'Orders and messages are kept as business records for as long as we need them for the order, after-sales and tax purposes. Google access is kept until it is disconnected.',
            ]],
            ['Your rights', [
                'Under the Data Privacy Act of 2012 (Republic Act No. 10173), you can ask to see, correct or delete the personal details we hold about you. Contact us below and we will answer within a reasonable time.',
            ]],
            ['Changes', [
                'If this policy changes, we update this page and the date at the top.',
            ]],
        ];
    }
}
