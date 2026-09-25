<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>@yield('title', 'Admin') · LCT Trading</title>
    <link rel="icon" href="{{ asset('favicon.ico') }}" sizes="any">
    @vite(['resources/css/app.css'])
</head>

<body>
    @php
        $pendingCount = \App\Models\Order::where('status', 'pending')->count();
        $unreadInquiries = \App\Models\Inquiry::where('is_read', false)->count();
        $lowCount = \App\Models\Product::lowStock()->count();
        $nav = [
            ['admin.dashboard', 'admin.dashboard', 'Dashboard', null, 'bxs-dashboard'],
            ['admin.orders.index', 'admin.orders.*', 'Orders', $pendingCount ?: null, 'bxs-receipt'],
            ['admin.inquiries.index', 'admin.inquiries.*', 'Inquiries', $unreadInquiries ?: null, 'bxs-message-dots'],
            ['admin.products.index', 'admin.products.index', 'Items', null, 'bxs-package'],
            ['admin.products.create', 'admin.products.create', 'Add item', null, 'bxs-plus-circle'],
            ['admin.products.import', 'admin.products.import', 'Excel / CSV upload', null, 'bxs-file-import'],
            ['admin.settings.edit', 'admin.settings.*', 'Settings', null, 'bxs-cog'],
        ];
    @endphp

    <div class="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
        <aside class="border-b-2 border-signal bg-foam-900 lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r lg:border-r-foam-600">
            <div class="flex items-center gap-2.5 px-4 py-4 lg:py-5">
                <img src="{{ asset('images/lct-mark.webp') }}" alt="" class="h-9 w-auto">
                <div class="leading-none">
                    <div class="font-cond text-[19px] font-extrabold text-steel-50">LCT TRADING</div>
                    <div class="mt-1 font-cond text-[10px] font-semibold uppercase tracking-[0.3em] text-steel-500">Admin</div>
                </div>
            </div>
            <nav class="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:px-3" aria-label="Admin">
                @foreach ($nav as [$route, $pattern, $label, $badge, $icon])
                    @php $active = request()->routeIs($pattern); @endphp
                    <a href="{{ route($route) }}" @if ($active) aria-current="page" @endif
                        class="stamp flex h-10 shrink-0 items-center justify-between gap-3 rounded-[4px] px-3 text-[15px] {{ $active ? 'plate' : 'text-steel-300 hover:bg-foam-700 hover:text-steel-50' }}">
                        <span class="flex items-center gap-3">
                            <i class="bx {{ $icon }} text-[19px] {{ $active ? 'text-signal' : 'text-steel-500' }}" aria-hidden="true"></i>
                            {{ $label }}
                        </span>
                        @if ($badge)
                            <span class="grid h-5 min-w-5 place-items-center rounded-[3px] bg-signal px-1 text-[12px] text-white">{{ $badge }}</span>
                        @endif
                    </a>
                @endforeach
                <a href="{{ route('catalog') }}" target="_blank" rel="noopener" class="stamp flex h-10 shrink-0 items-center rounded-[4px] px-3 text-[15px] text-steel-400 hover:bg-foam-700 hover:text-steel-50 gap-3"><i class="bx bxs-store-alt text-[19px] text-steel-500" aria-hidden="true"></i>View catalog</a>
                <form action="{{ route('admin.logout') }}" method="POST" class="shrink-0 lg:mt-4">
                    @csrf
                    <button type="submit" class="stamp flex h-10 w-full items-center rounded-[4px] px-3 text-[15px] text-steel-500 hover:bg-foam-700 hover:text-steel-50 gap-3"><i class="bx bx-log-out text-[19px]" aria-hidden="true"></i>Log out</button>
                </form>
            </nav>
            @if ($lowCount)
                <a href="{{ route('admin.products.index', ['stock' => 'low']) }}" class="mx-3 mb-4 hidden rounded-[4px] bg-signal-700/40 px-3 py-2.5 text-[13px] leading-snug text-steel-100 ring-1 ring-signal/50 hover:bg-signal-700/60 lg:block">
                    <span class="flex items-start gap-2.5">
                        <i class="bx bxs-error mt-0.5 text-[18px] text-[#ff7a7e]" aria-hidden="true"></i>
                        <span>
                            <strong class="stamp block text-[14px]">{{ number_format($lowCount) }} low on stock</strong>
                            At or below {{ \App\Models\Product::lowStockThreshold() }} pcs
                        </span>
                    </span>
                </a>
            @endif
        </aside>

        <div class="a-surface min-w-0">
            <header class="flex flex-wrap items-end justify-between gap-4 border-b border-steel-300 px-4 pb-4 pt-6 sm:px-8">
                <div>
                    <h1 class="font-cond text-[34px] font-extrabold uppercase leading-none">@yield('heading')</h1>
                    @hasSection('sub')
                        <p class="mt-1.5 text-[14px] text-steel-700">@yield('sub')</p>
                    @endif
                </div>
                <div class="flex flex-wrap gap-2">@yield('actions')</div>
            </header>

            <main class="px-4 py-6 sm:px-8">
                @if (session('success'))
                    <div class="mb-5 rounded-[4px] bg-[#d5f0dc] px-4 py-3 text-[14px] font-medium text-[#1b5a2c]" role="status">{{ session('success') }}</div>
                @endif
                @if (session('error'))
                    <div class="mb-5 rounded-[4px] bg-signal-soft px-4 py-3 text-[14px] font-medium text-signal-700" role="alert">{{ session('error') }}</div>
                @endif
                @if ($errors->any())
                    <div class="mb-5 rounded-[4px] bg-signal-soft px-4 py-3 text-[14px] font-medium text-signal-700" role="alert">{{ $errors->count() > 1 ? 'A few fields need a look.' : $errors->first() }}</div>
                @endif

                @yield('content')
            </main>
        </div>
    </div>
</body>

</html>
