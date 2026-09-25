<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /** Keys managed on the settings form, with their validation rules. */
    private const FIELDS = [
        'email'               => ['nullable', 'email', 'max:190'],
        'phone'               => ['nullable', 'string', 'max:60'],
        'viber'               => ['nullable', 'string', 'max:60'],
        'address'             => ['nullable', 'string', 'max:255'],
        'hours'               => ['nullable', 'string', 'max:120'],
        'facebook_url'        => ['nullable', 'url', 'max:255'],
        'bank_details'        => ['nullable', 'string', 'max:1000'],
        'low_stock_threshold' => ['nullable', 'integer', 'min:0', 'max:9999'],
        'pickup_note'         => ['nullable', 'string', 'max:255'],
        'price_note'          => ['nullable', 'string', 'max:255'],
        // Tabs on every product page; a tab with no text is not shown.
        'policy_warranty'     => ['nullable', 'string', 'max:5000'],
        'policy_shipping'     => ['nullable', 'string', 'max:5000'],
        'policy_returns'      => ['nullable', 'string', 'max:5000'],
        'policy_price_match'  => ['nullable', 'string', 'max:5000'],
        'policy_repair'       => ['nullable', 'string', 'max:5000'],
        'policy_per_order'    => ['nullable', 'string', 'max:5000'],
    ];

    public function edit()
    {
        return view('admin.settings.edit', ['settings' => Setting::map()]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate(self::FIELDS);

        foreach (array_keys(self::FIELDS) as $key) {
            Setting::set($key, isset($validated[$key]) ? (string) $validated[$key] : null);
        }

        return redirect()->route('admin.settings.edit')->with('success', 'Settings saved.');
    }
}
