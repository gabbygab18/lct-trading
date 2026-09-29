<?php

use App\Models\Product;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Sample items that the old category rules put in the wrong place: a
 * voltage in the name ("10A 250V", "12V") sent outlets, bulbs, sockets and
 * plugs to Power Tools. Moves each listed SKU only if it still sits in the
 * category the old rules gave it, so a category set by hand in the admin
 * is left alone.
 */
return new class extends Migration
{
    public function up(): void
    {
        $csv = base_path('scripts/data/category_fix_2026_09_29.csv');
        if (! is_file($csv)) {
            return;
        }

        $rows = array_map('str_getcsv', file($csv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES));
        array_shift($rows); // sku,from,to

        DB::transaction(function () use ($rows) {
            foreach ($rows as [$sku, $from, $to]) {
                DB::table('products')->where('sku', $sku)->where('category', $from)->update(['category' => $to]);
            }
        });

        Product::flushCatalogCache();
    }

    public function down(): void
    {
        // Data fix only; nothing to undo.
    }
};
