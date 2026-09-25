@php
    $o = $order->loadMissing('items');
    $money = fn ($v) => '₱'.number_format((float) $v, 2);
@endphp
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;background:#1b1b1d;font-family:Arial,Helvetica,sans-serif;color:#1b1b1d;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1b1b1d;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#f4f4f2;">
    <tr><td style="background:#1b1b1d;border-bottom:4px solid #d7141a;padding:20px 24px;">
        <div style="color:#c7c9cc;font-size:12px;letter-spacing:3px;text-transform:uppercase;">LCT Trading · New order request</div>
        <div style="color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:1px;margin-top:6px;">{{ $o->reference }}</div>
        <div style="color:#c7c9cc;font-size:13px;margin-top:4px;">{{ $o->created_at->timezone('Asia/Manila')->format('M j, Y g:i A') }} · {{ $o->item_count }} pcs · {{ $money($o->subtotal) }}</div>
    </td></tr>

    <tr><td style="padding:20px 24px 8px;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6b6d70;">Customer</div>
        <div style="font-size:18px;font-weight:bold;margin-top:4px;">{{ $o->customer_name }}</div>
        <div style="font-size:15px;margin-top:4px;"><a href="tel:{{ preg_replace('/[^0-9+]/', '', $o->phone) }}" style="color:#d7141a;font-weight:bold;">{{ $o->phone }}</a>@if ($o->email) · <a href="mailto:{{ $o->email }}" style="color:#1b1b1d;">{{ $o->email }}</a>@endif</div>
    </td></tr>

    <tr><td style="padding:8px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr>
                <td style="padding:6px 0;color:#6b6d70;width:130px;vertical-align:top;">{{ $o->fulfilment === 'ship' ? 'Deliver to' : 'Fulfilment' }}</td>
                <td style="padding:6px 0;">{{ $o->fulfilment === 'ship' ? $o->fullAddress() : 'Store pickup' }}</td>
            </tr>
            @if ($o->shipping_preference)
            <tr>
                <td style="padding:6px 0;color:#6b6d70;vertical-align:top;">Courier</td>
                <td style="padding:6px 0;">{{ \App\Models\Order::SHIPPING[$o->shipping_preference] ?? $o->shipping_preference }}</td>
            </tr>
            @endif
            <tr>
                <td style="padding:6px 0;color:#6b6d70;vertical-align:top;">Payment</td>
                <td style="padding:6px 0;">{{ \App\Models\Order::PAYMENT[$o->payment_preference] ?? $o->payment_preference }}</td>
            </tr>
            @if ($o->notes)
            <tr>
                <td style="padding:6px 0;color:#6b6d70;vertical-align:top;">Notes</td>
                <td style="padding:6px 0;white-space:pre-line;">{{ $o->notes }}</td>
            </tr>
            @endif
        </table>
    </td></tr>

    <tr><td style="padding:12px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;">
            <tr style="background:#1b1b1d;color:#ffffff;font-size:11px;letter-spacing:1px;text-transform:uppercase;">
                <td style="padding:8px;">SKU</td>
                <td style="padding:8px;">Item</td>
                <td style="padding:8px;text-align:right;">Qty</td>
                <td style="padding:8px;text-align:right;">Price</td>
                <td style="padding:8px;text-align:right;">Total</td>
            </tr>
            @foreach ($o->items as $item)
            <tr style="border-bottom:1px solid #d9dadc;">
                <td style="padding:8px;font-family:Consolas,monospace;font-weight:bold;white-space:nowrap;">{{ $item->sku }}</td>
                <td style="padding:8px;">{{ $item->name }}</td>
                <td style="padding:8px;text-align:right;font-weight:bold;">{{ $item->quantity }}</td>
                <td style="padding:8px;text-align:right;white-space:nowrap;">@if ($item->list_price)<span style="color:#8e9196;text-decoration:line-through;font-size:12px;">{{ $money($item->list_price) }}</span><br>@endif{{ $money($item->price) }}</td>
                <td style="padding:8px;text-align:right;white-space:nowrap;">{{ $money($item->line_total) }}</td>
            </tr>
            @endforeach
            <tr>
                <td colspan="4" style="padding:12px 8px;text-align:right;font-weight:bold;">Subtotal (before delivery)</td>
                <td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:16px;white-space:nowrap;">{{ $money($o->subtotal) }}</td>
            </tr>
        </table>
    </td></tr>

    <tr><td style="padding:8px 24px 24px;">
        <a href="{{ route('admin.orders.show', $o) }}" style="display:inline-block;background:#d7141a;color:#ffffff;font-weight:bold;text-decoration:none;padding:12px 20px;letter-spacing:1px;text-transform:uppercase;font-size:13px;">Open in admin</a>
        <div style="font-size:12px;color:#6b6d70;margin-top:14px;">Prices shown are what the catalog listed when the order was sent. Confirm stock, total and delivery fee with the customer.</div>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
