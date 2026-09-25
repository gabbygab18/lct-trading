<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku', 64)->unique();
            $table->string('name');
            $table->string('brand', 64)->index();
            // Lower shows first. The client's priority brands get 1..14.
            $table->unsignedSmallInteger('brand_rank')->default(999);
            $table->string('category', 100)->nullable()->index();
            $table->decimal('price', 12, 2);
            $table->integer('stock')->default(0);
            $table->string('image')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            // Seeded from the khmtools feed: shown as such in admin until the
            // client's own list replaces it.
            $table->boolean('is_placeholder')->default(false);
            $table->timestamps();

            $table->index(['is_active', 'brand_rank', 'name']);
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 32)->unique();
            $table->string('status', 16)->default('pending')->index();
            $table->string('customer_name');
            $table->string('phone', 30);
            $table->string('email')->nullable();
            $table->string('fulfilment', 10); // ship | pickup
            $table->string('address')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('barangay')->nullable();
            $table->string('city')->nullable();
            $table->string('region')->nullable();
            $table->string('postal_code', 10)->nullable();
            $table->string('shipping_preference', 32)->nullable();
            $table->string('payment_preference', 16);
            $table->text('notes')->nullable();
            $table->decimal('subtotal', 12, 2);
            $table->unsignedInteger('item_count');
            // Set when confirmation took stock out; cleared if it goes back.
            $table->timestamp('stock_deducted_at')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            // Kept even if the product is later deleted: the line is a record.
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sku', 64);
            $table->string('name');
            $table->string('brand', 64)->nullable();
            $table->decimal('price', 12, 2);
            $table->unsignedInteger('quantity');
            $table->decimal('line_total', 12, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('products');
        Schema::dropIfExists('settings');
    }
};
