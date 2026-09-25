@php $product = $product ?? null; @endphp

<div class="grid gap-6 xl:grid-cols-[1fr_320px]">
    <div class="a-card grid gap-4 p-5 sm:grid-cols-2">
        <div>
            <label for="sku" class="a-label">SKU / item code</label>
            <input id="sku" name="sku" value="{{ old('sku', $product?->sku) }}" required maxlength="64" class="a-input stamp">
            @error('sku')<p class="mt-1 text-[13px] text-signal-600">{{ $message }}</p>@enderror
        </div>
        <div>
            <label for="brand" class="a-label">Brand</label>
            <input id="brand" name="brand" value="{{ old('brand', $product?->brand) }}" required list="brand-list" class="a-input">
            <datalist id="brand-list">
                @foreach (config('catalog.priority_brands') as $b)<option value="{{ $b }}">@endforeach
            </datalist>
            @error('brand')<p class="mt-1 text-[13px] text-signal-600">{{ $message }}</p>@enderror
        </div>
        <div class="sm:col-span-2">
            <label for="name" class="a-label">Item name</label>
            <input id="name" name="name" value="{{ old('name', $product?->name) }}" required class="a-input">
            @error('name')<p class="mt-1 text-[13px] text-signal-600">{{ $message }}</p>@enderror
        </div>
        <div>
            <label for="category" class="a-label">Category</label>
            <input id="category" name="category" value="{{ old('category', $product?->category) }}" list="category-list" class="a-input">
            <datalist id="category-list">
                @foreach ($categories as $c)<option value="{{ $c }}">@endforeach
            </datalist>
        </div>
        <div class="grid grid-cols-3 gap-3 sm:col-span-2">
            <div>
                <label for="price" class="a-label">Price (₱)</label>
                <input id="price" name="price" value="{{ old('price', $product?->price) }}" required inputmode="decimal" class="a-input text-right">
                @error('price')<p class="mt-1 text-[13px] text-signal-600">{{ $message }}</p>@enderror
            </div>
            <div>
                <label for="discount_percent" class="a-label">Discount (% off)</label>
                <input id="discount_percent" name="discount_percent" value="{{ old('discount_percent', $product?->discount_percent ?: '') }}" inputmode="decimal" placeholder="0" class="a-input text-right">
                @error('discount_percent')<p class="mt-1 text-[13px] text-signal-600">{{ $message }}</p>@enderror
            </div>
            <div>
                <label for="stock" class="a-label">Stock</label>
                <input id="stock" name="stock" value="{{ old('stock', $product?->stock ?? 0) }}" required inputmode="numeric" class="a-input text-right">
                @error('stock')<p class="mt-1 text-[13px] text-signal-600">{{ $message }}</p>@enderror
            </div>
            <p id="sale-preview" class="col-span-3 -mt-1 text-[13px] text-steel-700"></p>
        </div>
        <script>
            // "Customer pays ₱X" as you type the price or discount.
            (() => {
                const price = document.getElementById('price'), pct = document.getElementById('discount_percent'), out = document.getElementById('sale-preview');
                const peso = (n) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const show = () => {
                    const p = parseFloat(price.value) || 0, d = Math.min(90, Math.max(0, parseFloat(pct.value) || 0));
                    out.textContent = d > 0 && p > 0 ? `Customers see ${peso(p)} crossed out and pay ${peso(Math.round(p * (100 - d)) / 100)} (${d}% off).` : '';
                };
                price.addEventListener('input', show); pct.addEventListener('input', show); show();
            })();
        </script>
        <div class="sm:col-span-2">
            <label for="description" class="a-label">Description <span class="font-normal text-steel-700">(optional, for staff reference)</span></label>
            <textarea id="description" name="description" rows="4" class="a-input">{{ old('description', $product?->description) }}</textarea>
        </div>
        <label class="flex items-center gap-2 text-[14px] sm:col-span-2">
            <input type="hidden" name="is_active" value="0">
            <input type="checkbox" name="is_active" value="1" class="size-4 accent-[#d7141a]" @checked(old('is_active', $product?->is_active ?? true))>
            Show in the catalog
        </label>
    </div>

    <div class="a-card space-y-3 p-5">
        <span class="a-label">Photo</span>
        <div class="grid aspect-square place-items-center overflow-hidden rounded-[4px] bg-steel-100">
            @if ($product?->image_url)
                <img src="{{ $product->image_url }}" alt="" class="size-full object-contain p-3 mix-blend-multiply">
            @else
                <span class="text-[13px] text-steel-700">No photo</span>
            @endif
        </div>
        <input type="file" name="photo" accept="image/*" class="block w-full text-[14px]">
        <p class="text-[12.5px] text-steel-700">JPG, PNG or WebP up to 4 MB. A plain white background looks best.</p>
        @if ($product?->image)
            <label class="flex items-center gap-2 text-[14px]"><input type="checkbox" name="remove_photo" value="1" class="size-4"> Remove current photo</label>
        @endif
        @error('photo')<p class="text-[13px] text-signal-600">{{ $message }}</p>@enderror
    </div>
</div>

<div class="mt-6 flex flex-wrap gap-2">
    <button class="a-btn a-btn-primary">{{ $product ? 'Save item' : 'Add item' }}</button>
    <a href="{{ request('back', route('admin.products.index')) }}" class="a-btn a-btn-ghost">Cancel</a>
</div>
