<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;

class DashboardController extends Controller
{
    public function index()
    {
        return view('admin.dashboard', [
            'pending'      => Order::where('status', 'pending')->count(),
            'confirmed'    => Order::where('status', 'confirmed')->count(),
            'itemCount'    => Product::active()->count(),
            'placeholders' => Product::where('is_placeholder', true)->count(),
            'threshold'    => Product::lowStockThreshold(),
            'lowStock'     => Product::lowStock()->orderBy('stock')->orderBy('brand_rank')->limit(12)->get(),
            'lowStockCount'=> Product::lowStock()->count(),
            'recent'       => Order::latest()->limit(8)->get(),
        ]);
    }
}
