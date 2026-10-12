{{-- To the customer, after they send the contact form. --}}
@extends('emails.layout')
@php
    $first = \Illuminate\Support\Str::of($inquiry->name)->explode(' ')->first();
    $store = \App\Support\Seo::store();
@endphp

@section('preheader', 'We got your message. LCT will call or text you back.')
@section('eyebrow', 'Message received')
@section('title', "Thanks, {$first}. We got your message.")

@section('content')
    <tr><td style="padding:12px 28px 26px;background:#fbf6f5;">
        <p style="margin:0;font-size:15px;line-height:1.65;color:#3d3f42;">
            We'll get back to you at <strong style="color:#1b1b1d;">{{ $inquiry->phone }}</strong>, usually within the day during store hours. If it's urgent, give us a call.
        </p>
        @if ($store['phone'])
            <a href="tel:{{ preg_replace('/[^0-9+]/', '', $store['phone']) }}" style="display:inline-block;margin-top:20px;background:#1b1b1d;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:999px;">Call LCT · {{ $store['phone'] }}</a>
        @endif
    </td></tr>
    <tr><td style="padding:24px 28px 8px;">
        <div style="font-size:16px;font-weight:800;">Your message · {{ $inquiry->topicLabel() }}</div>
        <div style="margin-top:10px;background:#f6f6f4;border-left:4px solid #d7141a;border-radius:8px;padding:16px 18px;font-size:15px;line-height:1.65;white-space:pre-line;">{{ $inquiry->message }}</div>
    </td></tr>
    <tr><td style="padding:22px 28px 30px;">
        <div style="background:#eef3ec;border-radius:12px;padding:18px 20px;font-size:14px;line-height:1.65;color:#3d3f42;">
            Know the SKU already? You can send the order yourself in the shop: add the items to your tray and we'll call to confirm the total.
            <div style="margin-top:12px;">Salamat,<br><strong style="color:#1b1b1d;">LCT Trading</strong></div>
        </div>
    </td></tr>
@endsection

@section('band', true)
@section('footnote', 'You are receiving this because you sent a message from lcttrading.com.')
