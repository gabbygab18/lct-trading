<?php

namespace App\Support;

use App\Models\Product;

/**
 * Product photos for the detail page.
 *
 * Sample items carry the source photo URLs from the khmtools feed. Those are
 * served straight from the feed's CDN, sized down by the CDN itself, and are no
 * longer downloaded here: cached on first view they reached ~600 MB, most of a
 * 1 GB hosting plan. Items the client adds use their own uploaded photos.
 */
class Gallery
{
    /** Photos per item and their width: enough for the page, light for phones. */
    private const MAX = 5;

    private const WIDTH = 700;

    /** @return list<string> public URLs, main photo first */
    public static function urls(Product $product): array
    {
        // Photos the client added: the list photo first, then the extras.
        if ($own = $product->ownGallery()) {
            return array_values(array_filter([$product->image_url, ...array_map(Product::photoUrl(...), $own)]));
        }

        $urls = [];
        foreach (array_filter((array) $product->gallery, 'is_string') as $src) {
            if (preg_match('#^https://cdn\.shopify\.com/#', $src)) { // only the feed's own CDN
                $urls[] = $src.(str_contains($src, '?') ? '&' : '?').'width='.self::WIDTH;
            }
            if (count($urls) === self::MAX) {
                break;
            }
        }

        // Fall back to the list photo when the feed has none.
        return $urls ?: array_values(array_filter([$product->image_url]));
    }
}
