{{-- Order details + item table, shared by the store's and the customer's email. --}}
@php
    $money = fn ($v) => '₱'.number_format((float) $v, 2);
    $row = 'padding:7px 0;font-size:14px;vertical-align:top;';
    $label = $row.'color:#6b6d70;width:120px;';
@endphp
<tr><td style="padding:24px 28px 4px;">
    <div style="font-size:16px;font-weight:800;">Order details</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
        <tr><td style="{{ $label }}">Reference</td><td style="{{ $row }}font-weight:800;letter-spacing:0.5px;">{{ $order->reference }}</td></tr>
        <tr><td style="{{ $label }}">Sent</td><td style="{{ $row }}">{{ $order->created_at->timezone('Asia/Manila')->format('M j, Y · g:i A') }}</td></tr>
        <tr><td style="{{ $label }}">{{ $order->fulfilment === 'ship' ? 'Deliver to' : 'Fulfilment' }}</td><td style="{{ $row }}">{{ $order->fulfilment === 'ship' ? $order->fullAddress() : 'Store pickup' }}</td></tr>
        @if ($order->shipping_preference)
            <tr><td style="{{ $label }}">Delivery</td><td style="{{ $row }}">{{ \App\Models\Order::SHIPPING[$order->shipping_preference] ?? $order->shipping_preference }}</td></tr>
        @endif
        <tr><td style="{{ $label }}">Payment</td><td style="{{ $row }}">{{ $order->fulfilment === 'pickup' && $order->payment_preference === 'cod' ? 'Cash at pickup' : (\App\Models\Order::PAYMENT[$order->payment_preference] ?? $order->payment_preference) }}</td></tr>
        @if ($order->notes)
            <tr><td style="{{ $label }}">Notes</td><td style="{{ $row }}white-space:pre-line;">{{ $order->notes }}</td></tr>
        @endif
    </table>
</td></tr>

<tr><td style="padding:16px 28px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
        <tr>
            <td style="padding:9px 10px;background:#1b1b1d;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:6px 0 0 6px;">Item</td>
            <td style="padding:9px 10px;background:#1b1b1d;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:right;">Qty</td>
            <td style="padding:9px 10px;background:#1b1b1d;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:right;border-radius:0 6px 6px 0;">Total</td>
        </tr>
        @foreach ($order->items as $item)
            <tr>
                <td style="padding:12px 10px;border-bottom:1px solid #ececea;">
                    <div style="font-size:12px;font-weight:800;letter-spacing:0.5px;color:#d7141a;">{{ $item->sku }}</div>
                    <div style="margin-top:2px;line-height:1.4;">{{ $item->name }}</div>
                    <div style="margin-top:2px;font-size:12px;color:#6b6d70;">
                        @if ($item->list_price)<span style="text-decoration:line-through;">{{ $money($item->list_price) }}</span> @endif{{ $money($item->price) }} each
                    </div>
                </td>
                <td style="padding:12px 10px;border-bottom:1px solid #ececea;text-align:right;font-weight:800;vertical-align:top;">{{ $item->quantity }}</td>
                <td style="padding:12px 10px;border-bottom:1px solid #ececea;text-align:right;white-space:nowrap;vertical-align:top;">{{ $money($item->line_total) }}</td>
            </tr>
        @endforeach
        <tr>
            <td colspan="2" style="padding:14px 10px 4px;text-align:right;font-size:14px;color:#55575b;">Subtotal · {{ $order->item_count }} {{ $order->item_count == 1 ? 'pc' : 'pcs' }}</td>
            <td style="padding:14px 10px 4px;text-align:right;font-size:18px;font-weight:800;white-space:nowrap;">{{ $money($order->subtotal) }}</td>
        </tr>
        <tr><td colspan="3" style="padding:0 10px;text-align:right;font-size:12px;color:#8e9196;">Delivery fee not included; confirmed by phone.</td></tr>
    </table>
</td></tr>
