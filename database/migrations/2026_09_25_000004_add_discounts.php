<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Per-item "less N%", applied automatically to the listed price.
            $table->decimal('discount_percent', 5, 2)->default(0)->after('price');
        });
        Schema::table('order_items', function (Blueprint $table) {
            // What the item listed at before the discount, for the record.
            $table->decimal('list_price', 12, 2)->nullable()->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $t) => $t->dropColumn('discount_percent'));
        Schema::table('order_items', fn (Blueprint $t) => $t->dropColumn('list_price'));
    }
};
