@extends('admin.layout')

@section('title', 'Dashboard')
@section('heading', 'Today')
@section('sub', now()->timezone('Asia/Manila')->format('l, F j'))

@section('content')
    @if ($placeholders)
        <div class="mb-6 rounded-[6px] bg-foam-800 px-5 py-4 text-[14px] leading-relaxed text-steel-200">
            <strong class="stamp text-[16px] text-white">{{ number_format($placeholders) }} sample items are live.</strong>
            They were loaded so the site could be previewed. Upload LCT's own item list on
            <a href="{{ route('admin.products.import') }}" class="font-semibold text-white underline">Excel / CSV upload</a>,
            then remove the samples there.
        </div>
    @endif

    <div class="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section class="a-card overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4">
                <h2 class="stamp text-[20px]">
                    Orders to confirm
                    <span class="ml-1 text-steel-700">{{ $pending }}</span>
                </h2>
                <a href="{{ route('admin.orders.index', ['status' => 'pending']) }}" class="a-btn a-btn-ghost a-btn-sm">All pending</a>
            </div>
            <table class="a-table">
                <thead>
                    <tr><th>Order</th><th>Customer</th><th class="text-right">Subtotal</th><th>Status</th></tr>
                </thead>
                <tbody>
                    @forelse ($recent as $order)
                        <tr>
                            <td><a href="{{ route('admin.orders.show', $order) }}" class="stamp text-[15px] {{ $order->is_read ? '' : 'text-signal' }}">{{ $order->reference }}</a>
                                <div class="text-[12.5px] text-steel-700">{{ $order->created_at->timezone('Asia/Manila')->diffForHumans() }}</div></td>
                            <td>{{ $order->customer_name }}<div class="text-[12.5px] text-steel-700">{{ $order->phone }}</div></td>
                            <td class="stamp text-right text-[15px]">₱{{ number_format($order->subtotal, 2) }}</td>
                            <td><span class="a-pill a-pill-{{ $order->status }}">{{ $order->status }}</span></td>
                        </tr>
                    @empty
                        <tr><td colspan="4" class="py-10 text-center text-steel-700">No orders yet. They show up here the moment a customer sends one.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </section>

        <section class="a-card overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4">
                <h2 class="stamp text-[20px]">
                    Low on stock
                    <span class="ml-1 text-steel-700">{{ number_format($lowStockCount) }}</span>
                </h2>
                <a href="{{ route('admin.products.index', ['stock' => 'low']) }}" class="a-btn a-btn-ghost a-btn-sm">See all</a>
            </div>
            <table class="a-table">
                <thead><tr><th>SKU</th><th>Item</th><th class="text-right">Stock</th></tr></thead>
                <tbody>
                    @forelse ($lowStock as $p)
                        <tr>
                            <td class="stamp whitespace-nowrap"><a href="{{ route('admin.products.edit', $p) }}">{{ $p->sku }}</a></td>
                            <td class="max-w-[260px] truncate" title="{{ $p->name }}">{{ $p->name }}</td>
                            <td class="stamp text-right text-[15px] {{ $p->stock <= 0 ? 'text-signal' : '' }}">{{ $p->stock }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="3" class="py-10 text-center text-steel-700">Nothing at or below {{ $threshold }} pcs.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </section>
    </div>

    <p class="mt-6 text-[13px] text-steel-700">{{ number_format($itemCount) }} items listed · {{ $confirmed }} confirmed orders waiting to be completed</p>
@endsection
