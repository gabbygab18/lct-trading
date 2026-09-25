<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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

        return view('admin.orders.index', [
            'orders' => $orders,
            'status' => $status,
            'q'      => $q,
            'counts' => Order::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
        ]);
    }

    public function show(Order $order)
    {
        if (! $order->is_read) {
            $order->forceFill(['is_read' => true])->save();
        }

        return view('admin.orders.show', ['order' => $order->load('items.product')]);
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
