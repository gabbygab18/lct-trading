<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Search-as-you-type for the search boxes: word completions built from the
 * catalog's own item names and SKUs, plus the best matching items.
 */
class SearchController extends Controller
{
    public function suggest(Request $request): JsonResponse
    {
        $q = Str::of((string) $request->query('q'))->squish()->limit(60, '')->toString();
        if (mb_strlen($q) < 2) {
            return response()->json(['suggestions' => [], 'products' => [], 'total' => 0]);
        }

        $base = Product::active()->search($q);
        $total = (clone $base)->count();

        // Rank a slice of the matches in PHP: SQL LIKE has no notion of relevance.
        // ponytail: 300-row pool per keystroke; move to FULLTEXT/Scout if the list grows past ~50k.
        $pool = (clone $base)->orderBy('brand_rank')->limit(300)
            ->get(['id', 'sku', 'name', 'brand', 'price', 'discount_percent', 'stock', 'image', 'type']);
        $products = $pool->sortByDesc(fn (Product $p) => self::score($q, $p))->take(5);

        return response()->json([
            'suggestions' => self::completions($q, $pool->pluck('name')->all()),
            'products'    => $products->map(fn (Product $p) => CatalogController::card($p))->values(),
            'total'       => $total,
        ]);
    }

    /** Higher is better: SKU hits, then what the item *is* (its type), then word matches. */
    public static function score(string $q, Product $p): float
    {
        $q = Str::lower($q);
        $sku = Str::lower($p->sku);
        $type = Str::lower((string) $p->type);
        $name = Str::lower($p->name);
        $score = $sku === $q ? 100 : (str_starts_with($sku, $q) ? 60 : 0);

        foreach (preg_split('/\s+/', $q, -1, PREG_SPLIT_NO_EMPTY) as $word) {
            if ($type !== '' && str_contains($type, $word)) {
                $score += 12;
            }
            if (preg_match('/\b'.preg_quote($word, '/').'/', $name)) {
                $score += 4;
            }
        }

        // In stock first; among equals the plainer (shorter) name is usually the tool, not a part.
        return $score + ($p->stock > 0 ? 3 : 0) - mb_strlen($name) / 40;
    }

    /**
     * "royu wd5" +"Royu WD515 3-Gang Switch…" → "royu wd515", "royu wd515 3 gang".
     * The last typed word is completed from a word in a matching name, then the
     * next word or two of that name are offered as longer phrases.
     *
     * @param  list<string>  $names
     * @return list<string>
     */
    public static function completions(string $q, array $names, int $limit = 5): array
    {
        $typed = preg_split('/\s+/', Str::lower($q), -1, PREG_SPLIT_NO_EMPTY);
        $last = array_pop($typed);
        $head = $typed ? implode(' ', $typed).' ' : '';
        $scores = [];

        foreach ($names as $name) {
            // Words only: "3-Gang" → "3 gang", "(Wide)" → "wide".
            $words = preg_split('/\s+/', trim(preg_replace('/[^a-z0-9.\/]+/', ' ', Str::lower($name))), -1, PREG_SPLIT_NO_EMPTY);
            foreach ($words as $i => $word) {
                if (! str_starts_with($word, $last) || in_array($word, $typed, true)) {
                    continue;
                }
                $phrase = $head.$word;
                for ($n = 0; $n <= 2; $n++) {
                    if ($n > 0) {
                        if (! isset($words[$i + $n])) {
                            break;
                        }
                        if (str_contains(' '.$phrase.' ', ' '.$words[$i + $n].' ')) {
                            break; // "drill driver drill"
                        }
                        $phrase .= ' '.$words[$i + $n];
                    }
                    // Shorter, more common phrases rank first.
                    $scores[$phrase] = ($scores[$phrase] ?? 0) + (3 - $n);
                }
                break;
            }
        }

        unset($scores[Str::lower($q)]);
        // "drill for", "switch with": a phrase can't end on a filler word.
        $scores = array_filter($scores, fn ($s, $phrase) => ! preg_match('/ (for|with|and|of|the|to|in|on|a|&)$/', $phrase), ARRAY_FILTER_USE_BOTH);
        arsort($scores);

        return array_slice(array_keys($scores), 0, $limit);
    }
}
