{{-- To LCT, for every message from the contact form. --}}
@extends('emails.layout')
@php $tel = preg_replace('/[^0-9+]/', '', $inquiry->phone); @endphp

@section('preheader', "{$inquiry->name}: ".\Illuminate\Support\Str::limit($inquiry->message, 90))
@section('eyebrow', 'New inquiry')
@section('title', $inquiry->topicLabel())

@section('content')
    <tr><td style="padding:12px 28px 26px;background:#fbf6f5;">
        <div style="font-size:20px;font-weight:800;">{{ $inquiry->name }}</div>
        <div style="margin-top:4px;font-size:15px;color:#3d3f42;">
            {{ $inquiry->phone }}@if ($inquiry->email) · <a href="mailto:{{ $inquiry->email }}" style="color:#1b1b1d;">{{ $inquiry->email }}</a>@endif
            · {{ $inquiry->created_at->timezone('Asia/Manila')->format('M j, Y · g:i A') }}
        </div>
        <a href="tel:{{ $tel }}" style="display:inline-block;margin-top:18px;background:#d7141a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:999px;">Call {{ $inquiry->phone }}</a>
        <a href="{{ route('admin.inquiries.show', $inquiry) }}" style="display:inline-block;margin-top:18px;margin-left:6px;background:#1b1b1d;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:999px;">Open in admin</a>
    </td></tr>
    <tr><td style="padding:24px 28px 30px;">
        <div style="font-size:16px;font-weight:800;">Message</div>
        <div style="margin-top:10px;background:#f6f6f4;border-left:4px solid #d7141a;border-radius:8px;padding:16px 18px;font-size:15px;line-height:1.65;white-space:pre-line;">{{ $inquiry->message }}</div>
    </td></tr>
@endsection

@section('footnote', 'Sent to the store email set in Admin → Settings.')
