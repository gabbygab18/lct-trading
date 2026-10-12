{{-- To LCT, for every new order request. --}}
@extends('emails.layout')
@php
    $order->loadMissing('items');
    $tel = preg_replace('/[^0-9+]/', '', $order->phone);
    $money = '₱'.number_format((float) $order->subtotal, 2);
@endphp

@section('preheader', "{$order->customer_name} · {$order->item_count} pcs · {$money}. Call to confirm stock, total and delivery.")
@section('eyebrow', 'New order request')
@section('title', $order->reference)

@section('content')
    <tr><td style="padding:12px 28px 26px;background:#fbf6f5;">
        <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#6b6d70;">Customer</div>
        <div style="margin-top:4px;font-size:20px;font-weight:800;">{{ $order->customer_name }}</div>
        <div style="margin-top:4px;font-size:15px;color:#3d3f42;">
            {{ $order->phone }}@if ($order->email) · <a href="mailto:{{ $order->email }}" style="color:#1b1b1d;">{{ $order->email }}</a>@endif
        </div>
        <a href="tel:{{ $tel }}" style="display:inline-block;margin-top:18px;background:#d7141a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:999px;">Call {{ $order->phone }}</a>
        <a href="{{ route('admin.orders.show', $order) }}" style="display:inline-block;margin-top:18px;margin-left:6px;background:#1b1b1d;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:999px;">Open in admin</a>
    </td></tr>

    @include('emails.partials.order-summary')

    <tr><td style="padding:16px 28px 30px;">
        <div style="background:#fff7e6;border-radius:12px;padding:16px 20px;font-size:13.5px;line-height:1.6;color:#5c4a1f;">
            Prices are what the catalog showed when the order was sent. Confirm stock, the total and the delivery fee with the customer, then mark the order <strong>Confirmed</strong> in the admin: that deducts the stock.
        </div>
    </td></tr>
@endsection

@section('footnote', 'Sent to the store email set in Admin → Settings.')
