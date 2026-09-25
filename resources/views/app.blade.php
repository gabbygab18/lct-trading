<!DOCTYPE html>
<html lang="en" class="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title inertia>{{ config('app.name', 'LCT Trading') }}</title>
    <meta name="description" content="LCT Trading, tools and hardware supply. Browse Makita, Bosch, DeWalt, Stanley, Ingco, Royu and more by name or SKU, see prices and stock, and send your order in minutes.">
    <meta name="theme-color" content="#1b1b1d">
    <meta property="og:site_name" content="LCT Trading">
    <meta property="og:title" content="LCT Trading · Tools & Hardware Supply">
    <meta property="og:description" content="Search by name or SKU, check price and stock, send your order. We confirm by phone.">
    <meta property="og:image" content="{{ asset('images/og.jpg') }}">
    <meta property="og:type" content="website">
    <link rel="icon" href="{{ asset('favicon.ico') }}" sizes="any">
    <link rel="icon" href="{{ asset('favicon.png') }}" type="image/png">
    <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png') }}">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>

<body>
    @inertia
</body>

</html>
