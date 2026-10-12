<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_crawlers_get_real_html_schema_sitemap_and_ai_files(): void
    {
        Product::create(['sku' => 'CH-PAINT-BRUSH-1-2', 'name' => 'Champ Paint Brush 1/2"', 'brand' => 'Champ', 'category' => 'Paint & Adhesives', 'price' => 14, 'stock' => 20]);
        Product::create(['sku' => 'LCT-0001', 'name' => 'Sample Drill', 'brand' => 'Makita', 'category' => 'Power Tools', 'price' => 999, 'stock' => 3, 'is_placeholder' => true]);

        // Product page: own title, Product + Offer schema in pesos, and the text in the HTML itself.
        $html = $this->get('/shop/CH-PAINT-BRUSH-1-2')->assertOk()->getContent();
        $this->assertStringContainsString('<title inertia>Champ Paint Brush 1/2&quot; Price Philippines | LCT Trading</title>', $html);
        $this->assertStringContainsString('"@type":"Product"', $html);
        $this->assertStringContainsString('"priceCurrency":"PHP","price":"14.00"', $html);
        $this->assertStringContainsString('index, follow', $html);
        $this->assertStringContainsString('<h1>Champ Paint Brush 1/2&quot;</h1>', $html);

        // Sample (copied) items stay out of search.
        $this->assertStringContainsString('noindex, follow', $this->get('/shop/LCT-0001')->getContent());

        // Clean brand URL, canonical to itself; ?brand= points there.
        $this->get('/brands/champ')->assertOk()->assertSee('<link rel="canonical" href="'.url('/brands/champ').'">', false);
        $this->get('/shop?brand=Champ')->assertSee('<link rel="canonical" href="'.url('/brands/champ').'">', false);
        $this->get('/brands/nope')->assertNotFound();

        // Brand pages open as a dated price list with answers, marked up as FAQ.
        $this->get('/brands/champ')->assertSee('<h1>Champ Price List Philippines</h1>', false)
            ->assertSee('"@type":"FAQPage"', false)->assertSee('Magkano ang Champ sa LCT Trading?');

        $sitemap = $this->get('/sitemap.xml')->assertOk()->getContent();
        $this->assertStringContainsString('/shop/CH-PAINT-BRUSH-1-2', $sitemap);
        $this->assertStringNotContainsString('/shop/LCT-0001', $sitemap);
        $this->assertStringContainsString('/categories/paint-adhesives', $sitemap);

        $this->get('/robots.txt')->assertOk()->assertSee('Sitemap: '.url('/sitemap.xml'))->assertSee('Disallow: /admin');
        $this->get('/llms.txt')->assertOk()->assertSee('# LCT Trading')->assertSee('/brands/champ');

        // The FAQ shown on How to order is the one in its FAQPage schema.
        $this->get('/how-to-order')->assertSee('"@type":"FAQPage"', false)->assertSee('Do I need an account to order from LCT Trading?');
    }
}
