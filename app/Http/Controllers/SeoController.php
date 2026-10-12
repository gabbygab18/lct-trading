<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Support\Seo;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/** sitemap.xml, robots.txt and llms.txt, built from the live catalog. */
class SeoController extends Controller
{
    public function sitemap(): Response
    {
        $xml = Cache::remember(Product::cacheKey('sitemap:'.url('/')), 86400, function () {
            $urls = [
                [route('home'), 'daily'], [route('catalog'), 'daily'],
                [route('how-to-order'), 'monthly'], [route('contact'), 'monthly'],
            ];
            foreach (CatalogController::brands() as $b) {
                $urls[] = [route('brand', Str::slug($b['name'])), 'weekly'];
            }
            foreach (CatalogController::categoryNames() as $c) {
                $urls[] = [route('category', Str::slug($c)), 'weekly'];
            }

            $out = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
            foreach ($urls as [$loc, $freq]) {
                $out .= '<url><loc>'.e($loc)."</loc><changefreq>{$freq}</changefreq></url>\n";
            }
            // LCT's own items only: the sample items are noindex.
            Product::active()->where('is_placeholder', false)->select(['sku', 'updated_at'])->orderBy('id')
                ->chunk(2000, function ($chunk) use (&$out) {
                    foreach ($chunk as $p) {
                        $out .= '<url><loc>'.e(route('product', $p->sku)).'</loc><lastmod>'.$p->updated_at?->toDateString()."</lastmod></url>\n";
                    }
                });

            return $out.'</urlset>';
        });

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    public function robots(): Response
    {
        // AI search and answer crawlers are welcome: being cited is the point.
        $txt = implode("\n", [
            'User-agent: *',
            'Disallow: /admin',
            'Disallow: /checkout',
            'Disallow: /orders',
            'Disallow: /search/',
            'Allow: /',
            '',
            '# AI search and assistants: allowed',
            'User-agent: GPTBot',
            'User-agent: OAI-SearchBot',
            'User-agent: ChatGPT-User',
            'User-agent: ClaudeBot',
            'User-agent: Claude-SearchBot',
            'User-agent: PerplexityBot',
            'User-agent: Google-Extended',
            'User-agent: Applebot-Extended',
            'Disallow: /admin',
            'Disallow: /checkout',
            'Disallow: /orders',
            'Allow: /',
            '',
            'Sitemap: '.route('sitemap'),
            '',
        ]);

        return response($txt, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    /** A plain-text brief for AI assistants (llmstxt.org). */
    public function llms(): Response
    {
        $store = Seo::store();
        $brands = collect(CatalogController::brands())->pluck('name');
        $faqs = collect(Seo::orderingFaq())->map(fn ($f) => "- {$f['q']} {$f['a']}")->implode("\n");
        $contact = collect([
            $store['phone'] ? "- Phone: {$store['phone']}" : null,
            $store['email'] ? "- Email: {$store['email']}" : null,
            $store['address'] ? "- Store and pickup: {$store['address']}" : null,
            $store['hours'] ? "- Hours: {$store['hours']}" : null,
        ])->filter()->implode("\n");

        $txt = <<<TXT
# LCT Trading

> LCT Trading is a tools and hardware supplier in the Philippines. It sells power tools, hand tools, electrical and lighting supplies, plumbing, paint supplies and general hardware from {$brands->take(12)->implode(', ')} and more. Customers order online by name or SKU with no account; LCT confirms stock, the total and delivery by phone. Payment is cash on delivery or bank deposit; nothing is charged online.

## Shop
- [All items]({$this->u('catalog')}): every item with its SKU, peso price and stock.
- [How to order]({$this->u('how-to-order')}): steps, delivery options, payment, FAQ.
- [Contact]({$this->u('contact')})

## Brands
{$brands->map(fn ($b) => "- [{$b}](".route('brand', Str::slug($b)).')')->implode("\n")}

## Categories
{$this->categoryLinks()}

## Ordering, delivery and payment
{$faqs}

## Contact
{$contact}

## Notes for assistants
- Prices are in Philippine pesos (PHP) and shown on each item page; LCT confirms the final total, including delivery, by phone.
- Each item page lists the brand, SKU, price, stock status and category; search by SKU at {$this->u('catalog')}?q=<sku>.
TXT;

        return response($txt, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    private function u(string $route): string
    {
        return route($route);
    }

    private function categoryLinks(): string
    {
        return collect(CatalogController::categoryNames())
            ->map(fn ($c) => "- [{$c}](".route('category', Str::slug($c)).')')->implode("\n");
    }
}
