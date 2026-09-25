<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Support\ItemImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DiscountTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_is_priced_with_the_items_discount(): void
    {
        $p = Product::create(['sku' => 'RMB1P125C10', 'name' => 'Royu 10kA MCB 125A', 'brand' => 'Royu',
            'price' => 390, 'discount_percent' => 10, 'stock' => 20]);

        $this->assertSame(351.0, $p->salePrice());

        // The shop card shows both prices and the percentage.
        $this->get('/shop')->assertInertia(fn ($page) => $page
            ->where('products.data.0.price', 351)
            ->where('products.data.0.listPrice', 390)
            ->where('products.data.0.discount', 10));

        $this->post('/orders', [
            'items' => [['id' => $p->id, 'quantity' => 3, 'price' => 1]],
            'customer_name' => 'Ana', 'phone' => '09171234567',
            'fulfilment' => 'pickup', 'payment_preference' => 'cod',
        ])->assertSessionHasNoErrors();

        $line = Order::sole()->items()->sole();
        $this->assertSame('351.00', $line->price);
        $this->assertSame('390.00', $line->list_price);
        $this->assertSame('1053.00', Order::sole()->subtotal);
    }

    public function test_discount_column_in_the_sheet(): void
    {
        $p = Product::create(['sku' => 'WD515', 'name' => 'Royu WD515', 'brand' => 'Royu', 'price' => 176, 'stock' => 5, 'discount_percent' => 5]);
        $csv = tempnam(sys_get_temp_dir(), 'lct').'.csv';

        file_put_contents($csv, "sku,discount\nWD515,\"less 12%\"\n");
        (new ItemImporter())->import($csv);
        $this->assertSame(12.0, $p->fresh()->discount_percent);

        // A price-only sheet leaves the discount alone.
        file_put_contents($csv, "sku,price\nWD515,180\n");
        (new ItemImporter())->import($csv);
        $this->assertSame(12.0, $p->fresh()->discount_percent);
        unlink($csv);
    }
}
