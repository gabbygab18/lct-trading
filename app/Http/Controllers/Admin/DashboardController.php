<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $tz = 'Asia/Manila';
        $now = now($tz);
        $threshold = Product::lowStockThreshold();

        // Six months of orders, grouped here: a store's order count is small,
        // and this stays the same on SQLite and MySQL.
        $orders = Order::where('created_at', '>=', $now->copy()->subMonths(5)->startOfMonth()->utc())
            ->get(['status', 'subtotal', 'created_at'])
            ->map(fn ($o) => ['status' => $o->status, 'subtotal' => (float) $o->subtotal, 'at' => $o->created_at->timezone($tz)]);
        $live = $orders->where('status', '!=', 'cancelled');

        $inRange = fn (Carbon $from, Carbon $to) => $live->filter(fn ($o) => $o['at']->between($from, $to));
        $thisWeek = $inRange($now->copy()->subDays(6)->startOfDay(), $now);
        $lastWeek = $inRange($now->copy()->subDays(13)->startOfDay(), $now->copy()->subDays(7)->endOfDay());
        $thisMonth = $inRange($now->copy()->startOfMonth(), $now);

        $daily = collect(range(13, 0))->map(function ($ago) use ($now, $live) {
            $day = $now->copy()->subDays($ago);
            $that = $live->filter(fn ($o) => $o['at']->isSameDay($day));
            return ['date' => $day->toDateString(), 'count' => $that->count(), 'value' => round($that->sum('subtotal'), 2)];
        });
        $monthly = collect(range(5, 0))->map(function ($ago) use ($now, $live) {
            $month = $now->copy()->startOfMonth()->subMonths($ago);
            $in = $live->filter(fn ($o) => $o['at']->isSameMonth($month));
            return ['label' => $month->format('M'), 'count' => $in->count(), 'value' => round($in->sum('subtotal'), 2)];
        });

        $active = Product::active();

        return Inertia::render('dashboard', [
            'title'        => 'My Dashboard',
            'pending'      => Order::where('status', 'pending')->count(),
            'confirmed'    => Order::where('status', 'confirmed')->count(),
            'placeholders' => Product::where('is_placeholder', true)->where('is_active', true)->count(),
            'threshold'    => $threshold,
            'month'        => ['count' => $thisMonth->count(), 'value' => $thisMonth->sum('subtotal')],
            'week'         => [
                'count'  => $thisWeek->count(),
                'before' => $lastWeek->count(),
                'value'  => $thisWeek->sum('subtotal'),
            ],
            'statusWeek'   => collect(['pending', 'confirmed', 'completed'])
                ->mapWithKeys(fn ($s) => [$s => $orders->filter(fn ($o) => $o['status'] === $s && $o['at']->gte($now->copy()->subDays(6)->startOfDay()))->count()]),
            'daily'        => $daily,
            'monthly'      => $monthly,
            'stock'        => [
                'items'  => (clone $active)->count(),
                'in'     => (clone $active)->where('stock', '>', $threshold)->count(),
                'low'    => (clone $active)->where('stock', '>', 0)->where('stock', '<=', $threshold)->count(),
                'out'    => (clone $active)->where('stock', '<=', 0)->count(),
                'hidden' => Product::where('is_active', false)->count(),
            ],
            'lowStock'     => Product::lowStock()->orderBy('stock')->orderBy('brand_rank')->limit(6)->get()
                ->map(fn ($p) => ['id' => $p->id, 'sku' => $p->sku, 'name' => $p->name, 'brand' => $p->brand, 'stock' => $p->stock, 'image_url' => $p->image_url]),
            'recent'       => Order::latest()->limit(8)->get()->map->adminRow(),
        ]);
    }
}
