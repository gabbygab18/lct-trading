{{-- To the customer, right after they send an order request. --}}
@extends('emails.layout')
@php
    $order->loadMissing('items');
    $first = \Illuminate\Support\Str::of($order->customer_name)->explode(' ')->first();
    $store = \App\Support\Seo::store();
    $priceNote = \App\Models\Setting::get('price_note') ?: "Prices are subject to LCT's confirmation. Bulk discounts may be approved when we contact you.";
    $payNow = $order->payment_preference === 'bank'
        ? 'Pay by bank deposit once we confirm; we send the account details then.'
        : ($order->fulfilment === 'pickup' ? 'Pay cash at the counter when you pick up your items.' : 'Pay cash when the items arrive at your door.');
@endphp

@section('preheader', "We got your order {$order->reference}. We'll call to confirm stock, the total and delivery.")
@section('eyebrow', 'Order received')
@section('title', "Thanks, {$first}. We got your order.")

@section('content')
    <tr><td style="padding:12px 28px 26px;background:#fbf6f5;">
        <p style="margin:0;font-size:15px;line-height:1.65;color:#3d3f42;">
            Your order request <strong style="color:#1b1b1d;">{{ $order->reference }}</strong> is with LCT. We'll call or text
            <strong style="color:#1b1b1d;">{{ $order->phone }}</strong> to confirm stock, the total and the delivery fee. Nothing is charged until then.
        </p>
        @if ($store['phone'])
            <a href="tel:{{ preg_replace('/[^0-9+]/', '', $store['phone']) }}" style="display:inline-block;margin-top:20px;background:#1b1b1d;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:999px;">Call LCT · {{ $store['phone'] }}</a>
        @endif
    </td></tr>

    @include('emails.partials.order-summary', ['customer' => true])

    @include('emails.partials.steps', ['steps' => [
        ['Step 1', 'We check stock', 'LCT checks every item in your tray against what is on the shelf.'],
        ['Step 2', 'We call to confirm', 'You get the final total and delivery fee before anything is sent.'],
        ['Step 3', $order->fulfilment === 'ship' ? 'Delivered to you' : 'Pick it up', $payNow],
    ]])

    <tr><td style="padding:22px 28px 30px;">
        <div style="background:#eef3ec;border-radius:12px;padding:18px 20px;font-size:14px;line-height:1.65;color:#3d3f42;">
            {{ $priceNote }} If something changes, just reply to this email or call us, and quote <strong>{{ $order->reference }}</strong>.
            <div style="margin-top:12px;">Salamat,<br><strong style="color:#1b1b1d;">LCT Trading</strong></div>
        </div>
    </td></tr>
@endsection

@section('band', true)
@section('footnote', 'You are receiving this because you sent an order request at lcttrading.com.')
