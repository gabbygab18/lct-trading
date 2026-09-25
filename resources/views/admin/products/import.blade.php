@extends('admin.layout')

@section('title', 'Excel / CSV upload')
@section('heading', 'Excel / CSV upload')
@section('sub', 'Add new items and update prices or stock in bulk, matched by SKU.')

@section('content')
    @if (session('import_errors'))
        <div class="a-card mb-6 p-5">
            <h2 class="stamp text-[18px]">{{ number_format(session('import_error_count')) }} rows were skipped</h2>
            <ul class="mt-2 max-h-64 list-disc space-y-0.5 overflow-y-auto pl-5 text-[13.5px] text-steel-800">
                @foreach (session('import_errors') as $e)<li>{{ $e }}</li>@endforeach
            </ul>
        </div>
    @endif

    <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <form action="{{ route('admin.products.import.store') }}" method="POST" enctype="multipart/form-data" class="a-card space-y-4 p-5">
            @csrf
            <h2 class="stamp text-[20px]">Upload a sheet</h2>
            <input type="file" name="file" accept=".xlsx,.csv" required class="block w-full text-[14px]">
            @error('file')<p class="text-[13px] font-medium text-signal-600">{{ $message }}</p>@enderror
            <button class="a-btn a-btn-primary">Upload and apply</button>
            <p class="text-[13px] text-steel-700">.xlsx or .csv, first sheet only, up to 20 MB.</p>
        </form>

        <div class="a-card space-y-3 p-5 text-[14px] leading-relaxed">
            <h2 class="stamp text-[20px]">How the sheet is read</h2>
            <p>Row 1 holds the column names. Only <strong>sku</strong> is required; include just the columns you want to change.</p>
            <table class="a-table text-[13.5px]">
                <tbody>
                    <tr><td class="stamp">sku</td><td>Matches an existing item, or adds a new one</td></tr>
                    <tr><td class="stamp">name</td><td>Needed for new items</td></tr>
                    <tr><td class="stamp">price</td><td>Needed for new items. “₱1,250.00” is fine</td></tr>
                    <tr><td class="stamp">stock</td><td>Count on hand</td></tr>
                    <tr><td class="stamp">brand, category</td><td>For filtering on the catalog</td></tr>
                    <tr><td class="stamp">image</td><td>A photo URL, or a file name in <code>public/images/products</code></td></tr>
                    <tr><td class="stamp">active</td><td>“no” hides the item</td></tr>
                </tbody>
            </table>
            <p>A sheet with only <strong>sku</strong> and <strong>price</strong> is a price update and leaves everything else alone.</p>
            <div class="flex flex-wrap gap-2 pt-1">
                <a href="{{ route('admin.products.template') }}" class="a-btn a-btn-ghost a-btn-sm">Download template</a>
                <a href="{{ route('admin.products.export') }}" class="a-btn a-btn-ghost a-btn-sm">Download current list</a>
            </div>
        </div>
    </div>

    @if ($placeholders)
        <form action="{{ route('admin.products.purge-placeholders') }}" method="POST" class="a-card mt-6 flex flex-wrap items-center justify-between gap-4 p-5"
            onsubmit="return confirm('Remove all {{ number_format($placeholders) }} sample items? Items you uploaded or edited stay.');">
            @csrf
            @method('DELETE')
            <div class="text-[14px] leading-relaxed">
                <h2 class="stamp text-[18px]">{{ number_format($placeholders) }} sample items still listed</h2>
                They came with the preview build. Once your own list is uploaded, remove them here. Any sample you edited or re-uploaded is kept.
            </div>
            <button class="a-btn a-btn-ghost !text-signal-600">Remove sample items</button>
        </form>
    @endif
@endsection
