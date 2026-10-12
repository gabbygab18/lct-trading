{{--
    Shared frame for every LCT email (after the Isla welcome email): top bar,
    eyebrow, big heading, content, an optional dark photo band, footer.
    Tables and inline styles only: that's what Gmail and Outlook render.
    Sections: preheader, eyebrow, title, content; @section('band') to show the
    photo band; footnote for the line above the footer.
--}}
@php
    $store = \App\Support\Seo::store();
    $red = '#d7141a';
    $ink = '#1b1b1d';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <title>@yield('title')</title>
</head>
<body style="margin:0;padding:0;background:#ecebe7;font-family:Poppins,'Segoe UI',Arial,Helvetica,sans-serif;color:{{ $ink }};-webkit-font-smoothing:antialiased;">
{{-- Inbox preview line --}}
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">@yield('preheader')&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecebe7;">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;">

    {{-- Top bar --}}
    <tr><td style="padding:22px 28px;border-bottom:1px solid #eeeeec;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;white-space:nowrap;">
                <a href="{{ url('/') }}" style="text-decoration:none;color:{{ $ink }};">
                    <img src="{{ asset('images/lct-mark.png') }}" width="26" height="30" alt="" style="vertical-align:middle;border:0;">
                    <span style="vertical-align:middle;font-size:17px;font-weight:800;letter-spacing:0.5px;margin-left:6px;">LCT TRADING</span>
                </a>
            </td>
            <td align="right" style="vertical-align:middle;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
                <a href="{{ route('catalog') }}" style="color:#55575b;text-decoration:none;">Shop</a>
                <span style="color:#c9cacc;">&nbsp;·&nbsp;</span>
                <a href="{{ route('how-to-order') }}" style="color:#55575b;text-decoration:none;">How to order</a>
                <span style="color:#c9cacc;">&nbsp;·&nbsp;</span>
                <a href="{{ route('contact') }}" style="color:#55575b;text-decoration:none;">Contact</a>
            </td>
        </tr></table>
    </td></tr>

    {{-- Heading --}}
    <tr><td style="padding:34px 28px 6px;background:#fbf6f5;">
        <span style="display:inline-block;background:#fde3e4;color:{{ $red }};font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:5px 10px;border-radius:6px;">@yield('eyebrow')</span>
        <h1 style="margin:14px 0 0;font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-0.5px;color:{{ $ink }};">@yield('title')</h1>
    </td></tr>

    @yield('content')

    {{-- Dark photo band --}}
    @hasSection('band')
    <tr><td background="{{ asset('images/email-band.jpg') }}" bgcolor="#1b1b1d" style="background:#1b1b1d url('{{ asset('images/email-band.jpg') }}') center/cover no-repeat;padding:40px 28px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#ff8a8d;">@yield('band-eyebrow', 'Need more for the job?')</div>
        <div style="margin-top:8px;font-size:28px;line-height:1.15;font-weight:800;color:#ffffff;">@yield('band-title', 'Your next order takes two minutes.')</div>
        <div style="margin-top:8px;font-size:14px;line-height:1.6;color:#e2e3e5;">@yield('band-text', 'Search by SKU, see the peso price and stock, send the tray. We confirm by phone.')</div>
        <div style="margin-top:22px;">
            <a href="{{ route('catalog') }}" style="display:inline-block;background:#ffffff;color:{{ $ink }};font-size:14px;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:8px;">Browse the shop</a>
            <a href="{{ route('how-to-order') }}" style="display:inline-block;margin-left:8px;border:1px solid rgba(255,255,255,0.6);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:8px;">How ordering works</a>
        </div>
    </td></tr>
    @endif

    {{-- Footer --}}
    <tr><td style="background:{{ $ink }};padding:26px 28px;border-top:4px solid {{ $red }};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">
                <img src="{{ asset('images/lct-mark.png') }}" width="22" height="25" alt="" style="vertical-align:middle;border:0;">
                <span style="vertical-align:middle;color:#ffffff;font-size:14px;font-weight:800;letter-spacing:0.5px;margin-left:6px;">LCT TRADING</span>
            </td>
            <td align="right" style="vertical-align:middle;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
                @if ($store['facebook'])<a href="{{ $store['facebook'] }}" style="color:#c7c9cc;text-decoration:none;">Facebook</a><span style="color:#55575b;">&nbsp;·&nbsp;</span>@endif
                <a href="{{ url('/') }}" style="color:#c7c9cc;text-decoration:none;">lcttrading.com</a>
            </td>
        </tr></table>
        <div style="margin-top:16px;font-size:12px;line-height:1.7;color:#9a9ca0;">
            @hasSection('footnote')@yield('footnote')<br>@endif
            Tools &amp; hardware supply · Nothing is charged online; LCT confirms every order by phone.
            @if ($store['phone'] || $store['address'])<br>{{ collect([$store['phone'], $store['address']])->filter()->implode(' · ') }}@endif
        </div>
    </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
