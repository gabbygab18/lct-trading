<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\User;
use App\Support\ItemImporter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('ADMIN_PASSWORD') ?: Str::password(16, symbols: false);
        User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@lcttrading.ph')],
            ['name' => 'LCT Admin', 'password' => Hash::make($password)],
        );
        if (! env('ADMIN_PASSWORD')) {
            $this->command?->warn("Admin password (save it now): {$password}");
        }

        // Obvious placeholders: the client fills these in from /admin > Settings.
        foreach ([
            'email'               => null,
            'phone'               => '0900 000 0000 (set in admin)',
            'viber'               => null,
            'address'             => 'Store address (set in admin)',
            'hours'               => null,
            'facebook_url'        => null,
            'bank_details'        => null,
            'low_stock_threshold' => '5',
            'policy_warranty'     => 'Warranty terms (set in admin): e.g. which brands carry a manufacturer warranty, for how long, and how LCT helps with claims.',
            'policy_returns'      => 'Returns (set in admin): e.g. how many days, what condition items must be in, and who pays the return delivery.',
        ] as $key => $value) {
            Setting::firstOrCreate(['key' => $key], ['value' => $value]);
        }

        // Sample catalog pulled from a public feed by scripts/fetch_khm_feed.py.
        // Every row is flagged as a placeholder until the client's list replaces it.
        $csv = base_path('scripts/data/seed_items.csv');
        if (is_file($csv)) {
            $importer = (new ItemImporter(placeholder: true))->import($csv);
            $this->command?->info("Items: {$importer->created} added, {$importer->updated} updated, ".count($importer->errors).' skipped.');
        }

        // The client's own supplier lists (Wixim, Setsu, boards), priced by
        // scripts/supplier_import.py. Real items, so not flagged as placeholders.
        $supplier = base_path('scripts/data/supplier_items.csv');
        if (is_file($supplier)) {
            $importer = (new ItemImporter)->import($supplier);
            $this->command?->info("Supplier items: {$importer->created} added, {$importer->updated} updated, ".count($importer->errors).' skipped.');
        }
    }
}
