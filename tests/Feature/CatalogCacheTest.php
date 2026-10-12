<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_cached_listing_shows_stock_after_an_order_is_confirmed(): void
    {
        $p = Product::create(['sku' => 'NK-BUT-1', 'name' => 'Butane 220g', 'brand' => 'Nam Kwang', 'price' => 75, 'stock' => 5]);

        // First visit fills the cache.
        $this->get('/shop')->assertInertia(fn ($page) => $page->where('products.data.0.stock', 5)->where('products.total', 1));
        $this->getJson('/search/suggest?q=butane')->assertJsonPath('products.0.stock', 5);

        $this->post('/orders', [
            'items' => [['id' => $p->id, 'quantity' => 2, 'price' => 75]],
            'customer_name' => 'Ana', 'phone' => '09171234567',
            'fulfilment' => 'pickup', 'payment_preference' => 'cod',
        ])->assertSessionHasNoErrors();
        Order::sole()->transitionTo('confirmed');

        $this->get('/shop')->assertInertia(fn ($page) => $page->where('products.data.0.stock', 3));
        $this->getJson('/search/suggest?q=butane')->assertJsonPath('products.0.stock', 3);
    }
}
