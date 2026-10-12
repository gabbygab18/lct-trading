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

    {{-- Email check: what the server sends with, and whether mail is going out. --}}
    <section class="a-card mt-6 max-w-3xl space-y-4 p-5" aria-labelledby="mail-check">
        <h2 id="mail-check" class="stamp text-[20px]">Email</h2>
        <dl class="grid grid-cols-[150px_1fr] gap-x-4 gap-y-1.5 text-[14px]">
            <dt class="text-steel-700">Sending through</dt><dd>{{ $mail['mailer'] === 'smtp' ? $mail['host'] : $mail['mailer'].' (not sending real email)' }}</dd>
            <dt class="text-steel-700">Login</dt><dd>{{ $mail['username'] ?: '—' }}</dd>
            <dt class="text-steel-700">From</dt><dd>{{ $mail['from'] }}</dd>
            <dt class="text-steel-700">Orders go to</dt><dd>{{ $mail['recipient'] ?: 'Nobody yet: fill in the order notification email above' }}</dd>
            <dt class="text-steel-700">Waiting to send</dt>
            <dd>
                {{ $mail['pending'] }}
                @if ($mail['stuck'])<span class="font-semibold text-signal-600"> · stuck for over 3 minutes: the cron job isn't running</span>@endif
            </dd>
            <dt class="text-steel-700">Failed</dt><dd>{{ $mail['failed'] }}</dd>
        </dl>
        @if ($mail['lastError'])
            <p class="rounded-[4px] bg-signal-soft px-3 py-2 text-[13px] text-signal-700"><strong>Last error:</strong> {{ $mail['lastError'] }}</p>
        @endif

        <div class="flex flex-wrap items-end gap-3 border-t border-steel-300 pt-4">
            <form action="{{ route('admin.settings.test-email') }}" method="POST" class="flex flex-wrap items-end gap-2">
                @csrf
                <div>
                    <label for="to" class="a-label">Send a test email to</label>
                    <input id="to" name="to" type="email" required value="{{ old('to', $mail['recipient']) }}" class="a-input w-72">
                </div>
                <button class="a-btn a-btn-primary">Send test email</button>
            </form>
            @if ($mail['pending'] || $mail['failed'])
                <form action="{{ route('admin.settings.run-queue') }}" method="POST">
                    @csrf
                    <button class="a-btn a-btn-ghost">Send waiting emails now</button>
                </form>
            @endif
        </div>
        <p class="text-[12.5px] text-steel-700">The test is sent straight away, so if the mail settings in <code>.env</code> are wrong, the error shows here. Order emails are sent by the cron job every minute.</p>
    </section>
@endsection
