<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_pages_send_browser_protection_headers(): void
    {
        $this->get('/')->assertOk()
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    public function test_a_faked_forwarded_ip_does_not_reset_the_login_limit(): void
    {
        // Behind Cloudflare with TRUSTED_PROXIES=cloudflare: someone hitting the
        // server's IP directly can't pose as a new visitor on every attempt.
        $this->refreshApplicationWithTrustedProxies('cloudflare');

        for ($i = 1; $i <= 7; $i++) {
            $response = $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.9'])
                ->withHeader('X-Forwarded-For', "198.51.100.{$i}")
                ->post('/admin/login', ['email' => 'admin@lcttrading.ph', 'password' => "guess-{$i}"]);
        }

        $response->assertStatus(429);
    }

    public function test_saving_an_item_only_goes_back_to_admin_pages(): void
    {
        $this->actingAs(\App\Models\User::factory()->create());
        $p = \App\Models\Product::create(['sku' => 'BK-1', 'name' => 'Back test', 'brand' => 'Champ', 'price' => 10, 'stock' => 1]);
        $form = ['sku' => 'BK-1', 'name' => 'Back test', 'brand' => 'Champ', 'price' => 10, 'stock' => 1, 'is_active' => 1];

        $this->put("/admin/items/{$p->id}", $form + ['back' => 'javascript:alert(1)'])
            ->assertRedirect(route('admin.products.index'));
        $this->put("/admin/items/{$p->id}", $form + ['back' => url('/admin/items?page=2')])
            ->assertRedirect(url('/admin/items?page=2'));
    }

    public function test_csv_export_defuses_spreadsheet_formulas(): void
    {
        \App\Models\Product::create(['sku' => 'X-1', 'name' => '=HYPERLINK("http://evil.test","click")', 'brand' => 'Champ', 'price' => 1, 'stock' => 1]);

        $csv = $this->actingAs(\App\Models\User::factory()->create())->get('/admin/items/export')->streamedContent();

        $this->assertStringContainsString("\"'=HYPERLINK(", $csv);
    }

    public function test_bots_cannot_send_orders_when_turnstile_is_on(): void
    {
        config(['services.turnstile.secret_key' => 'secret']);
        \Illuminate\Support\Facades\Http::fake(['challenges.cloudflare.com/*' => \Illuminate\Support\Facades\Http::response(['success' => false])]);
        $p = \App\Models\Product::create(['sku' => 'NK-BUT-1', 'name' => 'Butane', 'brand' => 'Nam Kwang', 'price' => 75, 'stock' => 5]);

        $this->post('/orders', [
            'items' => [['id' => $p->id, 'quantity' => 1]], 'customer_name' => 'Bot', 'phone' => '0917 123 4567',
            'email' => 'victim@example.com', 'fulfilment' => 'pickup', 'payment_preference' => 'cod', 'cf-turnstile-response' => 'x',
        ])->assertSessionHasErrors('turnstile');

        $this->assertSame(0, \App\Models\Order::count());
    }

    public function test_unknown_filters_and_searches_are_not_cached(): void
    {
        \App\Models\Product::create(['sku' => 'CH-1', 'name' => 'Champ Brush', 'brand' => 'Champ', 'category' => 'Paint & Adhesives', 'price' => 14, 'stock' => 5]);
        \Illuminate\Support\Facades\Cache::flush();

        $this->get('/shop?brand=NotABrand')->assertInertia(fn ($page) => $page->where('filters.brand', ''));
        $this->get('/shop?q=random-'.str_repeat('x', 300))->assertOk()
            ->assertInertia(fn ($page) => $page->where('filters.q', fn ($q) => mb_strlen($q) <= 100));
        $this->assertNull(\Illuminate\Support\Facades\Cache::get(\App\Models\Product::cacheKey('shop:'.json_encode(['q' => 'random-'.str_repeat('x', 93), 'brand' => '', 'category' => '', 'sort' => 'featured']).':1')));
    }

    private function refreshApplicationWithTrustedProxies(string $value): void
    {
        putenv("TRUSTED_PROXIES={$value}");
        $_ENV['TRUSTED_PROXIES'] = $_SERVER['TRUSTED_PROXIES'] = $value;
        $this->refreshApplication();
        putenv('TRUSTED_PROXIES');
        unset($_ENV['TRUSTED_PROXIES'], $_SERVER['TRUSTED_PROXIES']);
        $this->artisan('migrate');
    }
}
