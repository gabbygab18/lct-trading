@extends('admin.layout')

@php
    $tel = preg_replace('/[^0-9+]/', '', $order->phone);
    $next = [
        'pending'   => [['confirmed', 'Confirm order', 'Takes the items out of stock.'], ['cancelled', 'Cancel', null]],
        'confirmed' => [['completed', 'Mark completed', 'Delivered or picked up and paid.'], ['cancelled', 'Cancel', 'Puts the items back in stock.']],
        'completed' => [],
        'cancelled' => [['pending', 'Reopen', null]],
    ][$order->status];
@endphp

@section('title', $order->reference)
@section('heading', $order->reference)
@section('sub', $order->created_at->timezone('Asia/Manila')->format('D, M j, Y · g:i A').' · '.$order->item_count.' pcs')
@section('actions')
    <span class="a-pill a-pill-{{ $order->status }} self-center !text-[14px]">{{ $order->status }}</span>
@endsection

@section('content')
    <div class="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <section class="a-card overflow-x-auto">
            <table class="a-table min-w-[620px]">
                <thead><tr><th>SKU</th><th>Item</th><th class="text-right">Qty</th><th class="text-right">On hand</th><th class="text-right">Price</th><th class="text-right">Total</th></tr></thead>
                <tbody>
                    @foreach ($order->items as $item)
                        @php $onHand = $item->product?->stock; @endphp
                        <tr>
                            <td class="stamp whitespace-nowrap">
                                @if ($item->product)<a href="{{ route('admin.products.edit', [$item->product, 'back' => request()->fullUrl()]) }}" class="underline decoration-steel-400">{{ $item->sku }}</a>@else{{ $item->sku }}@endif
                            </td>
                            <td>{{ $item->name }}</td>
                            <td class="stamp text-right text-[16px]">{{ $item->quantity }}</td>
                            <td class="stamp text-right {{ $onHand !== null && ! $order->stock_deducted_at && $onHand < $item->quantity ? 'text-signal' : 'text-steel-700' }}">{{ $onHand ?? 'deleted' }}</td>
                            <td class="text-right whitespace-nowrap">
                                @if ($item->list_price)<span class="mr-1 text-[12.5px] text-steel-500 line-through">₱{{ number_format($item->list_price, 2) }}</span>@endif
                                ₱{{ number_format($item->price, 2) }}
                            </td>
                            <td class="stamp text-right whitespace-nowrap">₱{{ number_format($item->line_total, 2) }}</td>
                        </tr>
                    @endforeach
                    <tr>
                        <td colspan="5" class="text-right font-semibold">Subtotal before delivery</td>
                        <td class="stamp text-right text-[18px] whitespace-nowrap">₱{{ number_format($order->subtotal, 2) }}</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <aside class="space-y-4">
            <div class="a-card space-y-3 p-5 text-[14px] leading-relaxed">
                <div>
                    <div class="text-[18px] font-semibold">{{ $order->customer_name }}</div>
                    <a href="tel:{{ $tel }}" class="stamp text-[20px] text-signal">{{ $order->phone }}</a>
                    @if ($order->email)<div><a href="mailto:{{ $order->email }}" class="underline">{{ $order->email }}</a></div>@endif
                </div>
                <div class="border-t border-steel-200 pt-3">
                    <div class="a-label !mb-0.5">{{ $order->fulfilment === 'ship' ? 'Deliver to' : 'Fulfilment' }}</div>
                    {{ $order->fulfilment === 'ship' ? $order->fullAddress() : 'Pick up at store' }}
                    @if ($order->shipping_preference)<div class="mt-1 text-steel-700">{{ \App\Models\Order::SHIPPING[$order->shipping_preference] ?? $order->shipping_preference }}</div>@endif
                </div>
                <div class="border-t border-steel-200 pt-3">
                    <div class="a-label !mb-0.5">Payment</div>
                    {{ \App\Models\Order::PAYMENT[$order->payment_preference] ?? $order->payment_preference }}
                </div>
                @if ($order->notes)
                    <div class="border-t border-steel-200 pt-3">
                        <div class="a-label !mb-0.5">Customer notes</div>
                        <p class="whitespace-pre-line">{{ $order->notes }}</p>
                    </div>
                @endif
                @if ($order->stock_deducted_at)
                    <p class="border-t border-steel-200 pt-3 text-[13px] text-steel-700">Stock deducted {{ $order->stock_deducted_at->timezone('Asia/Manila')->format('M j, g:i A') }}.</p>
                @endif
            </div>

            @if ($next)
                <div class="a-card space-y-2 p-5">
                    @foreach ($next as [$to, $label, $hint])
                        <form action="{{ route('admin.orders.status', $order) }}" method="POST"
                            @if ($to === 'cancelled') onsubmit="return confirm('Cancel {{ $order->reference }}?');" @endif>
                            @csrf
                            @method('PATCH')
                            <input type="hidden" name="status" value="{{ $to }}">
                            <button class="a-btn w-full {{ $loop->first ? 'a-btn-primary' : 'a-btn-ghost' }}">{{ $label }}</button>
                            @if ($hint)<p class="mt-1 text-center text-[12.5px] text-steel-700">{{ $hint }}</p>@endif
                        </form>
                    @endforeach
                </div>
            @endif

            <form action="{{ route('admin.orders.destroy', $order) }}" method="POST" onsubmit="return confirm('Delete {{ $order->reference }} for good?');">
                @csrf
                @method('DELETE')
                <button class="text-[13px] text-steel-700 underline hover:text-signal-600">Delete this order</button>
            </form>
        </aside>
    </div>
@endsection
