@extends('admin.layout')

@section('title', 'Orders')
@section('heading', 'Orders')
@section('sub', 'Newest first. Call the customer, then confirm: confirming takes the items out of stock.')

@section('content')
    <div class="mb-4 flex flex-wrap items-center gap-2">
        <a href="{{ route('admin.orders.index', array_filter(['q' => $q])) }}" class="a-btn a-btn-sm {{ $status ? 'a-btn-ghost' : 'bg-foam-800 text-white' }}">All</a>
        @foreach (\App\Models\Order::STATUSES as $s)
            <a href="{{ route('admin.orders.index', array_filter(['status' => $s, 'q' => $q])) }}" class="a-btn a-btn-sm {{ $status === $s ? 'bg-foam-800 text-white' : 'a-btn-ghost' }}">
                {{ $s }} <span class="opacity-70">{{ $counts[$s] ?? 0 }}</span>
            </a>
        @endforeach
        <form method="GET" class="ml-auto flex gap-2">
            @if ($status)<input type="hidden" name="status" value="{{ $status }}">@endif
            <input type="search" name="q" value="{{ $q }}" placeholder="Order no., name or phone" class="a-input !h-9 w-64" aria-label="Search orders">
            <button class="a-btn a-btn-ghost a-btn-sm">Search</button>
        </form>
    </div>

    <div class="a-card overflow-x-auto">
        <table class="a-table min-w-[820px]">
            <thead>
                <tr><th>Order</th><th>Customer</th><th>Fulfilment</th><th>Payment</th><th class="text-right">Pcs</th><th class="text-right">Subtotal</th><th>Status</th></tr>
            </thead>
            <tbody>
                @forelse ($orders as $order)
                    <tr>
                        <td>
                            <a href="{{ route('admin.orders.show', $order) }}" class="stamp text-[15px] {{ $order->is_read ? '' : 'text-signal' }}">{{ $order->reference }}</a>
                            <div class="text-[12.5px] text-steel-700">{{ $order->created_at->timezone('Asia/Manila')->format('M j, g:i A') }}</div>
                        </td>
                        <td>{{ $order->customer_name }}<div class="text-[12.5px] text-steel-700">{{ $order->phone }}</div></td>
                        <td>{{ $order->fulfilment === 'ship' ? ($order->city ?: 'Deliver') : 'Pickup' }}
                            @if ($order->shipping_preference)<div class="text-[12.5px] text-steel-700">{{ \Illuminate\Support\Str::before(\App\Models\Order::SHIPPING[$order->shipping_preference] ?? '', ',') }}</div>@endif</td>
                        <td>{{ \App\Models\Order::PAYMENT[$order->payment_preference] ?? $order->payment_preference }}</td>
                        <td class="stamp text-right">{{ $order->item_count }}</td>
                        <td class="stamp text-right text-[15px]">₱{{ number_format($order->subtotal, 2) }}</td>
                        <td><span class="a-pill a-pill-{{ $order->status }}">{{ $order->status }}</span></td>
                    </tr>
                @empty
                    <tr><td colspan="7" class="py-12 text-center text-steel-700">No orders {{ $status ? "marked {$status}" : 'yet' }}.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-4">{{ $orders->links('admin.pagination') }}</div>
@endsection
