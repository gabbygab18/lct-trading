@extends('admin.layout')

@section('title', 'Settings')
@section('heading', 'Settings')
@section('sub', 'Shown on the catalog footer, checkout and order emails.')

@section('content')
    @php
        $fields = [
            ['email', 'Order notification email', 'email', 'Every new order is emailed here.'],
            ['phone', 'Store phone', 'text', 'Customers see this and can tap to call.'],
            ['viber', 'Viber / mobile (optional)', 'text', null],
            ['address', 'Store address', 'text', 'Shown for store pickup.'],
            ['hours', 'Store hours', 'text', 'e.g. Mon–Sat, 8 AM – 5 PM'],
            ['facebook_url', 'Facebook page link', 'url', null],
            ['low_stock_threshold', 'Low-stock alert at', 'number', 'Items at or below this count are flagged in the admin.'],
        ];
    @endphp
    <form action="{{ route('admin.settings.update') }}" method="POST" class="a-card grid max-w-3xl gap-5 p-5 sm:grid-cols-2">
        @csrf
        @method('PUT')
        @foreach ($fields as [$key, $label, $type, $hint])
            <div class="{{ in_array($key, ['address', 'email']) ? 'sm:col-span-2' : '' }}">
                <label for="{{ $key }}" class="a-label">{{ $label }}</label>
                <input id="{{ $key }}" name="{{ $key }}" type="{{ $type }}" value="{{ old($key, $settings[$key] ?? '') }}" class="a-input" @if ($type === 'number') min="0" @endif>
                @if ($hint)<p class="mt-1 text-[12.5px] text-steel-700">{{ $hint }}</p>@endif
                @error($key)<p class="mt-1 text-[13px] text-signal-600">{{ $message }}</p>@enderror
            </div>
        @endforeach
        <div class="sm:col-span-2">
            <label for="bank_details" class="a-label">Bank deposit details</label>
            <textarea id="bank_details" name="bank_details" rows="3" class="a-input" placeholder="BDO · LCT Trading · 0000 0000 0000">{{ old('bank_details', $settings['bank_details'] ?? '') }}</textarea>
            <p class="mt-1 text-[12.5px] text-steel-700">Shown when a customer picks bank deposit. Leave blank to send them after confirming.</p>
        </div>
        <div class="sm:col-span-2">
            <label for="price_note" class="a-label">Price note</label>
            <input id="price_note" name="price_note" value="{{ old('price_note', $settings['price_note'] ?? '') }}" class="a-input" placeholder="Prices are subject to LCT’s confirmation. Bulk discounts may be approved when we contact you.">
            <p class="mt-1 text-[12.5px] text-steel-700">Shown under prices on product pages, the tray and checkout. Leave blank to use the text shown here.</p>
        </div>
        <div class="sm:col-span-2">
            <label for="pickup_note" class="a-label">Pickup note</label>
            <input id="pickup_note" name="pickup_note" value="{{ old('pickup_note', $settings['pickup_note'] ?? '') }}" class="a-input" placeholder="e.g. Usually ready in 1–2 days">
            <p class="mt-1 text-[12.5px] text-steel-700">Shown under the store address on every product page. Leave blank to hide.</p>
        </div>

        <div class="border-t border-steel-300 pt-5 sm:col-span-2">
            <h2 class="font-display text-[20px] font-bold">Product page tabs</h2>
            <p class="mt-1 text-[13px] text-steel-700">Shown on every product page next to the description. A tab with no text is hidden. Plain text is fine; each line becomes a paragraph.</p>
        </div>
        @php
            $tabs = [
                ['policy_warranty', 'Warranty & service', null],
                ['policy_shipping', 'Shipping & delivery', 'Leave blank to show the default: couriers offered at checkout, fee confirmed by phone, store pickup.'],
                ['policy_returns', 'Returns', null],
                ['policy_price_match', 'Price match', 'Only if LCT offers one.'],
                ['policy_repair', 'Repair', 'Only if LCT offers repair or can refer to service centers.'],
                ['policy_per_order', 'Per order / special orders', 'For items not in stock that can be ordered in.'],
            ];
        @endphp
        @foreach ($tabs as [$key, $label, $hint])
            <div class="sm:col-span-2">
                <label for="{{ $key }}" class="a-label">{{ $label }}</label>
                <textarea id="{{ $key }}" name="{{ $key }}" rows="4" class="a-input">{{ old($key, $settings[$key] ?? '') }}</textarea>
                @if ($hint)<p class="mt-1 text-[12.5px] text-steel-700">{{ $hint }}</p>@endif
                @error($key)<p class="mt-1 text-[13px] text-signal-600">{{ $message }}</p>@enderror
            </div>
        @endforeach

        <div class="sm:col-span-2">
            <button class="a-btn a-btn-primary">Save settings</button>
        </div>
    </form>
@endsection
