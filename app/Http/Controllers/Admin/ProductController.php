<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\CatalogController;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Support\ItemImporter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['q', 'brand', 'stock', 'placeholder']);

        $products = Product::query()
            ->search($filters['q'] ?? null)
            ->when($filters['brand'] ?? null, fn ($q, $b) => $q->where('brand', $b))
            ->when(($filters['stock'] ?? null) === 'low', fn ($q) => $q->lowStock())
            ->when(($filters['stock'] ?? null) === 'out', fn ($q) => $q->where('stock', '<=', 0))
            ->when(($filters['stock'] ?? null) === 'hidden', fn ($q) => $q->where('is_active', false))
            ->when(($filters['placeholder'] ?? null) === '1', fn ($q) => $q->where('is_placeholder', true))
            ->orderBy('brand_rank')->orderBy('name')
            ->paginate(50)
            ->withQueryString();

        return view('admin.products.index', [
            'products'  => $products,
            'filters'   => $filters,
            'brands'    => Product::query()->distinct()->orderBy('brand')->pluck('brand'),
            'threshold' => Product::lowStockThreshold(),
        ]);
    }

    public function create()
    {
        return view('admin.products.create', ['categories' => $this->categories()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $product = Product::create($this->validated($request));

        return redirect()->route('admin.products.index', ['q' => $product->sku])
            ->with('success', "{$product->sku} added.");
    }

    public function edit(Product $product)
    {
        return view('admin.products.edit', ['product' => $product, 'categories' => $this->categories()]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $product->update($this->validated($request, $product));

        // Back to the filtered list the edit came from, but only ever on this site.
        $back = (string) $request->input('back');
        $back = str_starts_with($back, url('/admin')) ? $back : route('admin.products.index');

        return redirect()->to($back)
            ->with('success', "{$product->sku} saved.");
    }

    /** Price and stock straight from the list, the two things that change daily. */
    public function quickUpdate(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'price' => ['required', 'numeric', 'min:0', 'max:9999999'],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:90'],
            'stock' => ['required', 'integer', 'min:-99999', 'max:999999'],
        ]);
        $data['discount_percent'] = (float) ($data['discount_percent'] ?? 0);
        $product->update($data + ['is_placeholder' => false]);

        $less = $product->hasDiscount() ? ' less '.rtrim(rtrim(number_format($product->discount_percent, 2), '0'), '.').'% = ₱'.number_format($product->salePrice(), 2) : '';

        return back()->with('success', "{$product->sku}: ₱".number_format($product->price, 2)."{$less}, {$product->stock} in stock.");
    }

    public function destroy(Product $product): RedirectResponse
    {
        if (str_starts_with((string) $product->image, 'uploads/')) {
            Storage::disk('public')->delete($product->image);
        }
        $product->delete();

        return back()->with('success', "{$product->sku} removed. Past orders keep their copy of the line.");
    }

    public function importForm()
    {
        return view('admin.products.import', [
            'placeholders' => Product::where('is_placeholder', true)->count(),
        ]);
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:20480', 'mimes:xlsx,csv,txt'],
        ]);

        @set_time_limit(300);
        $file = $request->file('file');

        try {
            $importer = (new ItemImporter())->import($file->getRealPath(), $file->getClientOriginalName());
        } catch (Throwable $e) {
            return back()->withErrors(['file' => $e->getMessage()]);
        }

        return redirect()->route('admin.products.import')
            ->with('success', "Import done: {$importer->created} added, {$importer->updated} updated.")
            ->with('import_errors', array_slice($importer->errors, 0, 100))
            ->with('import_error_count', count($importer->errors));
    }

    /** Removes every item still marked as seeded sample data. */
    public function purgePlaceholders(): RedirectResponse
    {
        $count = Product::where('is_placeholder', true)->delete();
        Product::flushCatalogCache();

        return redirect()->route('admin.products.import')->with('success', "{$count} sample items removed.");
    }

    public function template(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // so Excel opens it as UTF-8
            fputcsv($out, ItemImporter::COLUMNS);
            fputcsv($out, ['DHP485Z', 'Makita DHP485Z Cordless Hammer Driver Drill 18V (bare)', 'Makita', 'Power Tools', '5450.00', '10', '6', 'dhp485z.webp', '', 'yes']);
            fclose($out);
        }, 'lct-items-template.csv', ['Content-Type' => 'text/csv']);
    }

    /** Full list as CSV, in the same columns the import reads back. */
    public function export(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ItemImporter::COLUMNS);
            Product::orderBy('brand_rank')->orderBy('name')->chunk(1000, function ($chunk) use ($out) {
                foreach ($chunk as $p) {
                    fputcsv($out, [$p->sku, $p->name, $p->brand, $p->category, $p->price, $p->discount_percent ?: '', $p->stock, $p->image, $p->description, $p->is_active ? 'yes' : 'no']);
                }
            });
            fclose($out);
        }, 'lct-items-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv']);
    }

    private function validated(Request $request, ?Product $product = null): array
    {
        $data = $request->validate([
            'sku'         => ['required', 'string', 'max:64', Rule::unique('products', 'sku')->ignore($product)],
            'name'        => ['required', 'string', 'max:255'],
            'brand'       => ['required', 'string', 'max:64'],
            'category'    => ['nullable', 'string', 'max:100'],
            'price'       => ['required', 'numeric', 'min:0', 'max:9999999'],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:90'],
            'stock'       => ['required', 'integer', 'min:-99999', 'max:999999'],
            'description' => ['nullable', 'string', 'max:5000'],
            'photo'       => ['nullable', 'image', 'max:4096'],
            'remove_photo'=> ['nullable', 'boolean'],
        ]);

        $ranks = array_flip(array_map('strtolower', config('catalog.priority_brands')));
        $data['brand_rank'] = ($ranks[strtolower($data['brand'])] ?? 998) + 1;
        $data['is_active'] = $request->boolean('is_active');
        $data['discount_percent'] = (float) ($data['discount_percent'] ?? 0);
        $data['is_placeholder'] = false;

        if ($request->hasFile('photo') || $request->boolean('remove_photo')) {
            if ($product && str_starts_with((string) $product->image, 'uploads/')) {
                Storage::disk('public')->delete($product->image);
            }
            $data['image'] = $request->hasFile('photo')
                ? $request->file('photo')->store('uploads/products', 'public')
                : null;
        }
        unset($data['photo'], $data['remove_photo']);

        return $data;
    }

    private function categories()
    {
        return Product::query()->whereNotNull('category')->distinct()->orderBy('category')->pluck('category');
    }
}
