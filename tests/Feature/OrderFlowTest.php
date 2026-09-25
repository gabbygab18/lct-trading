<?php

namespace Tests\Feature;

use App\Mail\OrderReceived;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Support\ItemImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OrderFlowTest extends TestCase
{
    use RefreshDatabase;

    private function product(array $attrs = []): Product
    {
        static $n = 0;
        $n++;

        return Product::create($attrs + [
            'sku' => "SKU-{$n}", 'name' => "Item {$n}", 'brand' => 'Makita', 'brand_rank' => 3,
            'price' => 100, 'stock' => 10,
        ]);
    }

    private function orderPayload(array $items, array $extra = []): array
    {
        return $extra + [
            'items' => $items,
            'customer_name' => 'Juan dela Cruz',
            'phone' => '0917 123 4567',
            'fulfilment' => 'ship',
            'address' => '12 Mabini St.',
            'barangay' => 'San Roque',
            'city' => 'Quezon City',
            'region' => 'Metro Manila',
            'shipping_preference' => 'courier',
            'payment_preference' => 'cod',
        ];
    }

    public function test_order_uses_database_prices_and_emails_the_store(): void
    {
        Mail::fake();
        Setting::set('email', 'orders@lct.test');
        $drill = $this->product(['price' => 5450]);
        $bit = $this->product(['price' => 85.5]);

        $response = $this->post('/orders', $this->orderPayload([
            ['id' => $drill->id, 'quantity' => 2, 'price' => 1], // client price is ignored
            ['id' => $bit->id, 'quantity' => 3],
        ]));

        $order = Order::with('items')->sole();
        $response->assertRedirect(route('orders.placed', $order->reference));
        $this->assertSame('11156.50', $order->subtotal);
        $this->assertSame(5, $order->item_count);
        $this->assertSame('pending', $order->status);
        $this->assertMatchesRegularExpression('/^LCT-\d{6}-[2-9A-Z]{4}$/', $order->reference);
        Mail::assertQueued(OrderReceived::class, fn ($m) => $m->hasTo('orders@lct.test'));

        // Stock only moves when staff confirm.
        $this->assertSame(10, $drill->fresh()->stock);

        // The receipt opens for this browser only.
        $this->get("/orders/{$order->reference}")->assertOk();
        $this->flushSession();
        $this->get("/orders/{$order->reference}")->assertNotFound();
    }

    public function test_out_of_stock_and_pickup_rules(): void
    {
        $gone = $this->product(['stock' => 0]);
        $this->post('/orders', $this->orderPayload([['id' => $gone->id, 'quantity' => 1]]))
            ->assertSessionHasErrors('items');

        $ok = $this->product();
        $this->post('/orders', [
            'items' => [['id' => $ok->id, 'quantity' => 1]],
            'customer_name' => 'Ana', 'phone' => '09171234567',
            'fulfilment' => 'pickup', 'payment_preference' => 'cod',
        ])->assertSessionHasNoErrors();
        $this->assertNull(Order::sole()->address);

        // Delivery without an address is refused.
        $this->post('/orders', ['items' => [['id' => $ok->id, 'quantity' => 1]], 'customer_name' => 'B',
            'phone' => '09171234567', 'fulfilment' => 'ship', 'payment_preference' => 'cod'])
            ->assertSessionHasErrors(['address', 'barangay', 'city']);
    }

    public function test_confirm_deducts_stock_cancel_restores_and_shortage_blocks(): void
    {
        $this->actingAs(User::factory()->create());
        $p = $this->product(['stock' => 5]);
        $this->post('/orders', $this->orderPayload([['id' => $p->id, 'quantity' => 4]]));
        $order = Order::sole();

        $this->patch("/admin/orders/{$order->id}/status", ['status' => 'confirmed'])->assertSessionHas('success');
        $this->assertSame(1, $p->fresh()->stock);

        // Confirming twice never double-deducts.
        $this->patch("/admin/orders/{$order->id}/status", ['status' => 'completed']);
        $this->assertSame(1, $p->fresh()->stock);

        $this->patch("/admin/orders/{$order->id}/status", ['status' => 'cancelled']);
        $this->assertSame(5, $p->fresh()->stock);

        // Not enough on hand: the confirm is refused and nothing moves.
        $p->update(['stock' => 2]);
        $this->patch("/admin/orders/{$order->id}/status", ['status' => 'pending']);
        $this->patch("/admin/orders/{$order->id}/status", ['status' => 'confirmed'])->assertSessionHas('error');
        $this->assertSame(2, $p->fresh()->stock);
        $this->assertSame('pending', $order->fresh()->status);
    }

    public function test_price_only_sheet_leaves_everything_else_alone(): void
    {
        $p = $this->product(['sku' => 'DHP485Z', 'price' => 5000, 'stock' => 7, 'category' => 'Power Tools']);
        $csv = tempnam(sys_get_temp_dir(), 'lct').'.csv';
        file_put_contents($csv, "Item Code,SRP\nDHP485Z,\"₱5,450.00\"\nNEW-1,99\n,5\n");

        $import = (new ItemImporter())->import($csv);
        unlink($csv);

        $p->refresh();
        $this->assertSame('5450.00', $p->price);
        $this->assertSame(7, $p->stock);
        $this->assertSame('Power Tools', $p->category);
        $this->assertSame(1, $import->updated);
        $this->assertSame(0, $import->created); // NEW-1 has no name
        $this->assertCount(2, $import->errors);
    }

    public function test_catalog_search_matches_every_word_in_name_or_sku(): void
    {
        $this->product(['sku' => 'GA4530', 'name' => 'Makita Angle Grinder 4"']);
        $this->product(['sku' => 'X1', 'name' => 'Makita Drill']);
        $this->product(['sku' => 'H1', 'name' => 'Hidden grinder', 'is_active' => false]);

        $this->get('/shop?q=grinder+makita')->assertInertia(fn ($page) => $page
            ->component('Catalog')
            ->where('products.total', 1)
            ->where('products.data.0.sku', 'GA4530'));
        $this->get('/shop?q=4530')->assertInertia(fn ($page) => $page->where('products.total', 1));
    }

    public function test_product_page_shows_active_items_only(): void
    {
        $p = $this->product(['sku' => '0 601 9N8 000', 'name' => 'Bosch GBH 2-24', 'brand' => 'Bosch']);
        $this->product(['name' => 'Bosch other', 'brand' => 'Bosch']);

        $this->get(route('product', $p->sku))->assertInertia(fn ($page) => $page
            ->component('Product')
            ->where('product.sku', '0 601 9N8 000')
            ->has('related', 1));

        // Shipping always has LCT's default text; empty policies stay hidden.
        \App\Models\Setting::set('policy_returns', 'Seven days, unused, with receipt.');
        $this->get(route('product', $p->sku))->assertInertia(fn ($page) => $page
            ->where('tabs.0.key', 'shipping')
            ->where('tabs.1.key', 'returns')
            ->has('tabs', 2));

        // Tags are searchable from the shop.
        $p->update(['tags' => ['Rotary hammer']]);
        $this->get('/shop?q=rotary')->assertInertia(fn ($page) => $page->where('products.total', 1));

        $p->update(['is_active' => false]);
        $this->get(route('product', $p->sku))->assertNotFound();
    }
}
