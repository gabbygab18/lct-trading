<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use RuntimeException;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $status = in_array($request->query('status'), Order::STATUSES, true) ? $request->query('status') : null;
        $q = trim((string) $request->query('q'));

        $orders = Order::query()
            ->when($status, fn ($query, $s) => $query->where('status', $s))
            ->when($q, fn ($query) => $query->where(fn ($w) => $w
                ->where('reference', 'like', "%{$q}%")
                ->orWhere('customer_name', 'like', "%{$q}%")
                ->orWhere('phone', 'like', "%{$q}%")))
            ->latest()
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('orders/index', [
            'title'  => 'Orders',
            'orders' => $orders->through(fn (Order $o) => $o->adminRow()),
            'status' => $status,
            'q'      => $q,
        ]);
    }

    public function show(Order $order)
    {
        if (! $order->is_read) {
            $order->forceFill(['is_read' => true])->save();
        }

        $order->load('items.product');

        return Inertia::render('orders/show', [
            'title' => $order->reference,
            'order' => [
                'id'                => $order->id,
                'reference'         => $order->reference,
                'status'            => $order->status,
                'created_at'        => $order->created_at->toIso8601String(),
                'item_count'        => $order->item_count,
                'subtotal'          => (float) $order->subtotal,
                'customer_name'     => $order->customer_name,
                'phone'             => $order->phone,
                'email'             => $order->email,
                'fulfilment'        => $order->fulfilment,
                'address'           => $order->fullAddress(),
                'shipping'          => $order->shipping_preference ? (Order::SHIPPING[$order->shipping_preference] ?? $order->shipping_preference) : null,
                'payment'           => Order::PAYMENT[$order->payment_preference] ?? $order->payment_preference,
                'notes'             => $order->notes,
                'stock_deducted_at' => $order->stock_deducted_at?->toIso8601String(),
            ],
            'lines' => $order->items->map(fn ($item) => [
                'id'         => $item->id,
                'sku'        => $item->sku,
                'name'       => $item->name,
                'quantity'   => $item->quantity,
                'price'      => (float) $item->price,
                'list_price' => $item->list_price ? (float) $item->list_price : null,
                'line_total' => (float) $item->line_total,
                'product_id' => $item->product?->id,
                'on_hand'    => $item->product?->stock,
            ]),
        ]);
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(Order::STATUSES)]]);

        try {
            $order->transitionTo($data['status']);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        $note = match (true) {
            $data['status'] === 'confirmed' && $order->stock_deducted_at => ' Stock was deducted.',
            $data['status'] === 'cancelled' => ' Any deducted stock was returned.',
            default => '',
        };

        return back()->with('success', "{$order->reference} is now {$order->status}.{$note}");
    }

    public function destroy(Order $order): RedirectResponse
    {
        if ($order->stock_deducted_at && $order->status !== 'completed') {
            $order->transitionTo('cancelled');
        }
        $order->delete();

        return redirect()->route('admin.orders.index')->with('success', "{$order->reference} deleted.");
    }
}
