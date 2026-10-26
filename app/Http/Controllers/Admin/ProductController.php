<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\CatalogController;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Support\ItemImporter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
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

        return Inertia::render('items/index', [
            'title'     => 'Items',
            'products'  => $products->through(fn (Product $p) => [
                'id'               => $p->id,
                'sku'              => $p->sku,
                'name'             => $p->name,
                'brand'            => $p->brand,
                'category'         => $p->category,
                'price'            => (float) $p->price,
                'discount_percent' => (float) $p->discount_percent,
                'sale_price'       => $p->salePrice(),
                'stock'            => $p->stock,
                'is_active'        => (bool) $p->is_active,
                'is_placeholder'   => (bool) $p->is_placeholder,
                'image_url'        => $p->image_url,
            ]),
            'filters'   => (object) $filters,
            'brands'    => Product::query()->distinct()->orderBy('brand')->pluck('brand'),
            'threshold' => Product::lowStockThreshold(),
        ]);
    }

    public function create()
    {
        return $this->form(null);
    }

    public function store(Request $request): RedirectResponse
    {
        $product = Product::create($this->validated($request));

        return redirect()->route('admin.products.index', ['q' => $product->sku])
            ->with('success', "{$product->sku} added.");
    }

    public function edit(Product $product)
    {
        return $this->form($product);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $product->update($this->validated($request, $product));

        // Back to the filtered list the edit came from, but only ever on this site.
        $back = (string) $request->input('back');
        $back = str_starts_with($back, url('/admin').'/') ? $back : route('admin.products.index');

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

        return redirect()->route('admin.products.index')->with('success', "{$product->sku} removed. Past orders keep their copy of the line.");
    }

    public function importForm()
    {
        return Inertia::render('items/import', [
            'title'            => 'Excel / CSV upload',
            'placeholders'     => Product::where('is_placeholder', true)->count(),
            'maxMb'            => $this->maxUploadKb() / 1024,
            'importErrors'     => session('import_errors'),
            'importErrorCount' => (int) session('import_error_count', 0),
        ]);
    }

    /** The smaller of our 20 MB cap and PHP's upload_max_filesize / post_max_size. */
    private function maxUploadKb(): int
    {
        return (int) min(20480, floor(\Illuminate\Http\UploadedFile::getMaxFilesize() / 1024));
    }

    public function import(Request $request): RedirectResponse
    {
        // PHP can drop an upload before Laravel sees it (size limit, full disk,
        // no temp folder); say which, instead of a bare "failed to upload".
        $upload = $request->file('file');
        if ($upload && ! $upload->isValid()) {
            return back()->withErrors(['file' => $upload->getErrorMessage()]);
        }

        $maxMb = round($this->maxUploadKb() / 1024, 1);
        $request->validate([
            'file' => ['required', 'file', 'max:'.$this->maxUploadKb(), 'mimes:xlsx,csv,txt'],
        ], [
            'file.max' => "The file is bigger than this server accepts ({$maxMb} MB). Split it into smaller sheets.",
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
                    // A leading = + - @ makes Excel run the cell as a formula: prefix with '.
                    $safe = fn ($v) => is_string($v) && preg_match('/^[=+\-@\t\r]/', $v) ? "'".$v : $v;
                    fputcsv($out, array_map($safe, [$p->sku, $p->name, $p->brand, $p->category, $p->price, $p->discount_percent ?: '', $p->stock, $p->image, $p->description, $p->is_active ? 'yes' : 'no']));
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
            'photos'      => ['nullable', 'array', 'max:8'],
            'photos.*'    => ['image', 'max:4096'],
            'remove_gallery'   => ['nullable', 'array'],
            'remove_gallery.*' => ['string'],
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
            $data['image'] = $request->hasFile('photo') ? self::savePhoto($request->file('photo')) : null;
        }
        // Extra photos: keep the ones not ticked for removal, then add new uploads.
        if ($request->hasFile('photos') || $request->filled('remove_gallery')) {
            $remove = (array) $request->input('remove_gallery', []);
            $keep = [];
            foreach ((array) $product?->gallery as $g) {
                if (in_array($g, $remove, true)) {
                    if (is_string($g) && str_starts_with($g, 'uploads/')) {
                        Storage::disk('public')->delete($g);
                    }
                    continue;
                }
                $keep[] = $g;
            }
            foreach ((array) $request->file('photos', []) as $file) {
                $keep[] = self::savePhoto($file);
            }
            $data['gallery'] = $keep ?: null;
        }
        unset($data['photo'], $data['remove_photo'], $data['photos'], $data['remove_gallery']);

        return $data;
    }

    /**
     * Phone photos run 2–4 MB. Saved as WebP no wider than 1200px they're
     * around 100 KB and look the same on the shop. Falls back to the file as
     * uploaded if GD can't read it.
     */
    private static function savePhoto(UploadedFile $file): string
    {
        $im = function_exists('imagewebp') ? @imagecreatefromstring((string) file_get_contents($file->getRealPath())) : false;
        if (! $im) {
            return $file->store('uploads/products', 'public');
        }

        // Phones store photos sideways plus a "turn me" flag that GD ignores.
        $turn = function_exists('exif_read_data') ? (int) (@exif_read_data($file->getRealPath())['Orientation'] ?? 1) : 1;
        $im = match ($turn) {
            3 => imagerotate($im, 180, 0),
            6 => imagerotate($im, -90, 0),
            8 => imagerotate($im, 90, 0),
            default => $im,
        };
        imagepalettetotruecolor($im);
        [$w, $h] = [imagesx($im), imagesy($im)];
        if (max($w, $h) > 1200) {
            $im = imagescale($im, $w >= $h ? 1200 : (int) round(1200 * $w / $h));
        }
        imagealphablending($im, false);
        imagesavealpha($im, true);

        ob_start();
        imagewebp($im, null, 75);
        $path = 'uploads/products/'.Str::random(40).'.webp';
        Storage::disk('public')->put($path, ob_get_clean());

        return $path;
    }

    /** Add and edit share one React page. */
    private function form(?Product $product)
    {
        return Inertia::render('items/form', [
            'title'      => $product ? $product->sku : 'Add item',
            'product'    => $product ? [
                'id'               => $product->id,
                'sku'              => $product->sku,
                'name'             => $product->name,
                'brand'            => $product->brand,
                'category'         => $product->category,
                'price'            => (float) $product->price,
                'discount_percent' => (float) $product->discount_percent,
                'stock'            => $product->stock,
                'description'      => $product->description,
                'is_active'        => (bool) $product->is_active,
                'image'            => $product->image,
                'image_url'        => $product->image_url,
                'gallery'          => array_map(fn ($g) => ['path' => $g, 'url' => Product::photoUrl($g)], $product->ownGallery()),
                'changed'          => $product->is_placeholder
                    ? 'Sample item. Saving it makes it one of LCT’s own.'
                    : 'Last changed '.$product->updated_at->timezone('Asia/Manila')->diffForHumans(),
            ] : null,
            'categories' => $this->categories(),
            'brands'     => array_values(array_unique([...config('catalog.priority_brands'), ...Product::query()->distinct()->orderBy('brand')->pluck('brand')->all()])),
            'back'       => request('back'),
        ]);
    }

    private function categories()
    {
        return Product::query()->whereNotNull('category')->distinct()->orderBy('category')->pluck('category');
    }
}
