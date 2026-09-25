@extends('admin.layout')

@section('title', 'Items')
@section('heading', 'Items')
@section('sub', number_format($products->total()).' '.\Illuminate\Support\Str::plural('item', $products->total()).' · change price or stock right in the row and press Save')
@section('actions')
    <a href="{{ route('admin.products.export') }}" class="a-btn a-btn-ghost">Download list</a>
    <a href="{{ route('admin.products.create') }}" class="a-btn a-btn-primary">Add item</a>
@endsection

@section('content')
    <form method="GET" class="mb-4 grid gap-2 sm:grid-cols-[1fr_180px_180px_auto]">
        <label class="sr-only" for="q">Search</label>
        <input id="q" name="q" value="{{ $filters['q'] ?? '' }}" placeholder="Name or SKU" class="a-input" type="search">
        <select name="brand" class="a-input" aria-label="Brand">
            <option value="">All brands</option>
            @foreach ($brands as $b)
                <option @selected(($filters['brand'] ?? '') === $b)>{{ $b }}</option>
            @endforeach
        </select>
        <select name="stock" class="a-input" aria-label="Stock">
            <option value="">Any stock</option>
            <option value="low" @selected(($filters['stock'] ?? '') === 'low')>Low (≤ {{ $threshold }})</option>
            <option value="out" @selected(($filters['stock'] ?? '') === 'out')>Out of stock</option>
            <option value="hidden" @selected(($filters['stock'] ?? '') === 'hidden')>Hidden from catalog</option>
        </select>
        <button class="a-btn a-btn-ghost">Filter</button>
    </form>

    <div class="a-card overflow-x-auto">
        <table class="a-table min-w-[900px]">
            <thead>
                <tr>
                    <th class="w-14"></th>
                    <th>SKU</th>
                    <th>Item</th>
                    <th>Brand</th>
                    <th class="w-[360px]">Price (₱) · % off · Stock</th>
                    <th class="w-28"></th>
                </tr>
            </thead>
            <tbody>
                @forelse ($products as $p)
                    <tr class="{{ $p->is_active ? '' : 'opacity-60' }}">
                        <td>
                            @if ($p->image_url)
                                <img src="{{ $p->image_url }}" alt="" loading="lazy" class="size-10 rounded-[3px] bg-steel-100 object-contain mix-blend-multiply">
                            @endif
                        </td>
                        <td class="stamp whitespace-nowrap text-[14px]">{{ $p->sku }}</td>
                        <td class="max-w-[360px]">
                            <div class="line-clamp-2" title="{{ $p->name }}">{{ $p->name }}</div>
                            <div class="mt-0.5 flex flex-wrap gap-1">
                                @if ($p->category)<span class="text-[12.5px] text-steel-700">{{ $p->category }}</span>@endif
                                @if ($p->is_placeholder)<span class="a-pill a-pill-sample">Sample</span>@endif
                                @if ($p->hasDiscount())<span class="a-pill a-pill-low">−{{ rtrim(rtrim(number_format($p->discount_percent, 2), '0'), '.') }}% · ₱{{ number_format($p->salePrice(), 2) }}</span>@endif
                                @if (! $p->is_active)<span class="a-pill a-pill-cancelled">Hidden</span>@endif
                                @if ($p->is_active && $p->stock <= $threshold)<span class="a-pill a-pill-low">{{ $p->stock <= 0 ? 'Out' : 'Low' }}</span>@endif
                            </div>
                        </td>
                        <td class="whitespace-nowrap">{{ $p->brand }}</td>
                        <td>
                            <form action="{{ route('admin.products.quick', $p) }}" method="POST" class="flex items-center gap-1.5">
                                @csrf
                                @method('PATCH')
                                <input name="price" value="{{ $p->price }}" inputmode="decimal" class="a-input !h-9 w-28 text-right" aria-label="Price of {{ $p->sku }}">
                                <input name="discount_percent" value="{{ $p->discount_percent ?: '' }}" placeholder="0%" inputmode="decimal" class="a-input !h-9 w-16 text-right" aria-label="Discount percent for {{ $p->sku }}" title="Discount, % off">
                                <input name="stock" value="{{ $p->stock }}" inputmode="numeric" class="a-input !h-9 w-20 text-right" aria-label="Stock of {{ $p->sku }}">
                                <button class="a-btn a-btn-ghost a-btn-sm">Save</button>
                            </form>
                        </td>
                        <td class="whitespace-nowrap text-right">
                            <a href="{{ route('admin.products.edit', [$p, 'back' => request()->fullUrl()]) }}" class="a-btn a-btn-ghost a-btn-sm">Edit</a>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="6" class="py-12 text-center text-steel-700">No items match. <a href="{{ route('admin.products.index') }}" class="font-semibold underline">Clear filters</a></td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4">{{ $products->onEachSide(1)->links('admin.pagination') }}</div>
@endsection
