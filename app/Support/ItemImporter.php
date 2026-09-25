<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use RuntimeException;

/**
 * Bulk add/update items from an Excel (.xlsx) or CSV sheet, matched by SKU.
 *
 * Only the columns present in the sheet are written, so a sheet with just
 * "sku" and "price" is a price update and leaves everything else alone.
 * New SKUs need at least a name and a price.
 */
class ItemImporter
{
    public const COLUMNS = ['sku', 'name', 'brand', 'category', 'price', 'discount', 'stock', 'image', 'description', 'active'];

    /** Read if present but not offered in the template (the seed sheet uses it). */
    private const EXTRA = ['gallery', 'type', 'tags'];

    /** Header spellings staff are likely to type, mapped to our columns. */
    private const ALIASES = [
        'item code' => 'sku', 'code' => 'sku', 'product code' => 'sku', 'model' => 'sku',
        'item name' => 'name', 'item' => 'name', 'product' => 'name', 'product name' => 'name',
        'srp' => 'price', 'unit price' => 'price', 'selling price' => 'price',
        'discount %' => 'discount', 'less' => 'discount', 'less %' => 'discount', 'discount_percent' => 'discount',
        'qty' => 'stock', 'quantity' => 'stock', 'stocks' => 'stock', 'on hand' => 'stock',
        'photo' => 'image', 'image url' => 'image', 'picture' => 'image',
        'is_active' => 'active', 'status' => 'active',
    ];

    /** @var list<string> */
    public array $errors = [];

    public int $created = 0;

    public int $updated = 0;

    public function __construct(private bool $placeholder = false)
    {
    }

    public function import(string $path, ?string $originalName = null): static
    {
        $ext = strtolower(pathinfo($originalName ?? $path, PATHINFO_EXTENSION));
        $reader = match ($ext) {
            'xlsx' => new XlsxReader(),
            'csv', 'txt' => new CsvReader(),
            default => throw new RuntimeException('Upload an .xlsx or .csv file.'),
        };

        $reader->open($path);
        $header = null;
        $batch = [];
        $line = 0;

        try {
            foreach ($reader->getSheetIterator() as $sheet) {
                foreach ($sheet->getRowIterator() as $row) {
                    $line++;
                    $cells = array_map(fn ($c) => is_string($c) ? trim($c) : $c, $row->toArray());

                    if ($header === null) {
                        $header = $this->mapHeader($cells);
                        continue;
                    }
                    if (count(array_filter($cells, fn ($c) => $c !== '' && $c !== null)) === 0) {
                        continue;
                    }

                    $record = [];
                    foreach ($header as $i => $col) {
                        if ($col !== null) {
                            $record[$col] = $cells[$i] ?? null;
                        }
                    }
                    $batch[$line] = $record;

                    if (count($batch) >= 500) {
                        $this->flush($batch, $header);
                        $batch = [];
                    }
                }
                break; // first sheet only
            }
            $this->flush($batch, $header ?? []);
        } finally {
            $reader->close();
            Product::flushCatalogCache();
        }

        return $this;
    }

    /** @return array<int, string|null> */
    private function mapHeader(array $cells): array
    {
        $map = [];
        foreach ($cells as $i => $cell) {
            $key = Str::of((string) $cell)->lower()->squish()->toString();
            $key = self::ALIASES[$key] ?? $key;
            $map[$i] = in_array($key, [...self::COLUMNS, ...self::EXTRA], true) ? $key : null;
        }
        if (! in_array('sku', $map, true)) {
            throw new RuntimeException('The first row needs a "sku" column (header names: '.implode(', ', self::COLUMNS).').');
        }

        return $map;
    }

    private function flush(array $batch, array $header): void
    {
        if (! $batch) {
            return;
        }

        $present = array_values(array_unique(array_filter($header)));
        $existing = Product::whereIn('sku', array_map(fn ($r) => (string) ($r['sku'] ?? ''), $batch))
            ->pluck('sku')->mapWithKeys(fn ($sku) => [strtoupper($sku) => true]);
        $ranks = array_flip(array_map('strtolower', config('catalog.priority_brands')));
        $now = now();
        $inserts = $updates = [];

        foreach ($batch as $line => $r) {
            $sku = Str::limit(trim((string) ($r['sku'] ?? '')), 64, '');
            if ($sku === '') {
                $this->errors[] = "Row {$line}: missing SKU, skipped.";
                continue;
            }
            $isNew = ! isset($existing[strtoupper($sku)]);

            $price = array_key_exists('price', $r) ? $this->number($r['price']) : null;
            if (in_array('price', $present, true) && ($price === null || $price < 0)) {
                $this->errors[] = "Row {$line} ({$sku}): price \"{$r['price']}\" is not a number, skipped.";
                continue;
            }
            if ($isNew && (blank($r['name'] ?? null) || $price === null)) {
                $this->errors[] = "Row {$line} ({$sku}): new items need a name and a price, skipped.";
                continue;
            }

            // Only what the sheet carries, so a price-only sheet touches price only.
            $row = ['sku' => $sku];
            foreach ($present as $col) {
                $value = $r[$col] ?? null;
                match ($col) {
                    'sku' => null,
                    'price' => $row['price'] = $price,
                    'stock' => $row['stock'] = (int) ($this->number($value) ?? 0),
                    'discount' => $row['discount_percent'] = min(90, max(0, (float) ($this->number($value) ?? 0))),
                    'active' => $row['is_active'] = ! in_array(strtolower((string) $value), ['0', 'no', 'false', 'inactive', 'hidden'], true),
                    'name' => $row['name'] = Str::limit((string) $value, 255, ''),
                    'brand' => $row['brand'] = Str::limit((string) $value, 64, '') ?: 'Other',
                    'category' => $row['category'] = Str::limit((string) $value, 100, '') ?: null,
                    'gallery', 'tags' => $row[$col] = blank($value) ? null : json_encode(array_values(array_filter(explode('|', (string) $value)))),
                    'type' => $row['type'] = Str::limit((string) $value, 100, '') ?: null,
                    default => $row[$col] = blank($value) ? null : (string) $value,
                };
            }
            if (isset($row['brand'])) {
                $row['brand_rank'] = ($ranks[strtolower($row['brand'])] ?? 998) + 1;
            }
            $row['is_placeholder'] = $this->placeholder;
            $row['updated_at'] = $now;

            if ($isNew) {
                $inserts[strtoupper($sku)] = $row + [
                    'brand' => 'Other', 'brand_rank' => 999, 'category' => null, 'stock' => 0,
                    'discount_percent' => 0, 'image' => null, 'gallery' => null, 'type' => null, 'tags' => null, 'description' => null, 'is_active' => true, 'created_at' => $now,
                ];
                $this->created++;
            } else {
                $updates[strtoupper($sku)] = $row;
                $this->updated++;
            }
        }

        DB::transaction(function () use ($inserts, $updates) {
            if ($inserts) {
                // insert() needs identical keys and order on every row.
                $cols = array_keys(reset($inserts));
                sort($cols);
                Product::insert(array_map(fn ($r) => array_merge(array_fill_keys($cols, null), array_intersect_key($r, array_flip($cols))), array_values($inserts)));
            }
            // Row by row: an upsert's insert half would trip NOT NULL on the
            // columns a partial sheet leaves out (SQLite and strict MySQL both).
            foreach ($updates as $row) {
                Product::where('sku', $row['sku'])->update(array_diff_key($row, ['sku' => true]));
            }
        });
    }

    private function number(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }
        $clean = preg_replace('/[^\d.\-]/', '', (string) $value); // "₱1,250.00" -> 1250.00

        return is_numeric($clean) ? (float) $clean : null;
    }
}
