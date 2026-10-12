@php
    $seo ??= new \App\Support\Seo('LCT Trading | Tools & Hardware Supplier in the Philippines', 'Tools and hardware supplier in the Philippines. Browse Makita, Bosch, DeWalt, Stanley, Ingco, Royu and more by name or SKU, see peso prices and stock, and send your order in minutes.');
@endphp
<!DOCTYPE html>
<html lang="en-PH" class="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title inertia>{{ $seo->title }}</title>
    <meta name="description" content="{{ $seo->description }}" inertia="description">
    <meta name="robots" content="{{ $seo->index ? 'index, follow, max-image-preview:large' : 'noindex, follow' }}">
    <link rel="canonical" href="{{ $seo->canonical }}">
    <meta name="theme-color" content="#1b1b1d">
    <meta property="og:site_name" content="LCT Trading">
    <meta property="og:locale" content="en_PH">
    <meta property="og:type" content="{{ $seo->type }}">
    <meta property="og:title" content="{{ $seo->title }}">
    <meta property="og:description" content="{{ $seo->description }}">
    <meta property="og:url" content="{{ $seo->canonical }}">
    <meta property="og:image" content="{{ $seo->image ?? asset('images/og.jpg') }}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="{{ asset('favicon.ico') }}" sizes="any">
    <link rel="icon" href="{{ asset('favicon.png') }}" type="image/png">
    <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png') }}">
    <script type="application/ld+json">{!! $seo->jsonLd() !!}</script>
    {{-- Icons are a 3 KB font: fetch it with the page, not after the CSS. --}}
    <link rel="preload" href="{{ Vite::asset('resources/fonts/boxicons-subset.woff2') }}" as="font" type="font/woff2" crossorigin>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>

<body>
    {{-- Same root as @inertia, but with a plain HTML version of the page inside
         for crawlers that don't run JavaScript; React replaces it on load. --}}
    <div id="app" data-page="{{ json_encode($page) }}">@include('seo.fallback')</div>
</body>

</html>
