<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Product extends Model
{
    protected $fillable = [
        'sku', 'name', 'brand', 'brand_rank', 'category', 'price', 'discount_percent', 'stock',
        'image', 'gallery', 'type', 'tags', 'description', 'is_active', 'is_placeholder',
    ];

    protected $casts = [
        'price'          => 'decimal:2',
        'discount_percent' => 'float',
        'stock'          => 'integer',
        'brand_rank'     => 'integer',
        'is_active'      => 'boolean',
        'is_placeholder' => 'boolean',
        'gallery'        => 'array',
        'tags'           => 'array',
    ];

    /**
     * `image` is a file name under public/images/products (seeded and
     * bulk-imported rows), a path on the public disk (admin uploads), or a
     * full URL pasted into the import sheet.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (blank($this->image)) {
            return null;
        }
        if (str_starts_with($this->image, 'http')) {
            return $this->image;
        }
        if (str_starts_with($this->image, 'uploads/')) {
            return asset('storage/'.$this->image);
        }

        // ?v=<modified time>: a photo replaced under the same name shows at once, not from cache.
        $file = 'images/products/'.$this->image;
        $mtime = @filemtime(public_path($file));

        return asset($file).($mtime ? '?v='.$mtime : '');
    }

    /**
     * Catalog lists (brands, category counts) are cached; bumping the version
     * retires every one of them at once. Bulk imports skip model events, so
     * the importer bumps it by hand.
     */
    public static function cacheKey(string $name): string
    {
        return 'catalog:'.Cache::get('catalog:version', 0).':'.md5($name);
    }

    public static function flushCatalogCache(): void
    {
        Cache::forever('catalog:version', Cache::get('catalog:version', 0) + 1);
    }

    protected static function booted(): void
    {
        static::saved(fn () => static::flushCatalogCache());
        static::deleted(fn () => static::flushCatalogCache());
    }

    /** What the customer pays: the listed price less the item's discount. */
    public function salePrice(): float
    {
        $pct = min(90, max(0, (float) $this->discount_percent));

        return round((float) $this->price * (1 - $pct / 100), 2);
    }

    public function hasDiscount(): bool
    {
        return (float) $this->discount_percent > 0;
    }

    /** SQL for the price after discount, for sorting by what people actually pay. */
    public const SALE_PRICE_SQL = 'price * (1 - discount_percent / 100.0)';

    public static function lowStockThreshold(): int
    {
        return max(0, (int) Setting::get('low_stock_threshold', '5'));
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock(Builder $query): Builder
    {
        return $query->active()->where('stock', '<=', static::lowStockThreshold());
    }

    /** Name or SKU contains every word typed, in any order. */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        foreach (preg_split('/\s+/', trim((string) $term), -1, PREG_SPLIT_NO_EMPTY) as $word) {
            $like = '%'.addcslashes($word, '%_\\').'%';
            $query->where(fn ($q) => $q->where('name', 'like', $like)->orWhere('sku', 'like', $like)->orWhere('tags', 'like', $like));
        }

        return $query;
    }
}
