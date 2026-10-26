<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <meta name="theme-color" content="#1b1b1d">
    <link rel="icon" href="{{ asset('favicon.ico') }}" sizes="any">
    <title inertia>Admin · LCT Trading</title>
    {{-- Light / Dark / System (lct-stocks' appearance), applied before paint so there's no flash. --}}
    <script>
        (() => {
            let a = 'system';
            try { a = localStorage.getItem('appearance') || 'system'; } catch (e) {}
            const dark = a === 'dark' || (a === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', dark);
        })();
    </script>
    @viteReactRefresh
    @vite(['resources/css/admin.css', 'resources/js/admin/app.tsx'])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
