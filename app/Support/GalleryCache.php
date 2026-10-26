<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;
use Throwable;

use function Illuminate\Support\defer;

/**
 * Product photos for the detail page.
 *
 * Sample items carry the source photo URLs from the khmtools feed. Rather
 * than download ~600 MB of galleries up front, a product's photos are fetched
 * the first time its page is opened, saved under public/images/products/
 * gallery, and served locally from then on. Items the client adds have no
 * gallery URLs, so this never reaches out for them.
 *
 * The fetch runs after the response (defer), so no visitor waits on it.
 */
class GalleryCache
{
    private const DIR = 'images/products/gallery';

    private const MAX = 8;

    /** @return list<string> public URLs, main photo first */
    public static function urls(Product $product): array
    {
        // Photos the client added: the list photo first, then the extras.
        if ($own = $product->ownGallery()) {
            return array_values(array_filter([$product->image_url, ...array_map(Product::photoUrl(...), $own)]));
        }

        $sources = array_slice(array_values(array_filter((array) $product->gallery, 'is_string')), 0, self::MAX);
        $local = [];
        $missing = [];

        foreach ($sources as $src) {
            if (! preg_match('#^https://cdn\.shopify\.com/#', $src)) {
                continue; // only the feed's own CDN
            }
            $file = self::DIR.'/'.md5($src).'.webp';
            $local[$src] = $file;
            if (! is_file(public_path($file))) {
                $missing[] = $src;
            }
        }

        // Fetched after the response is sent: this visitor gets the list photo
        // (or what's cached), the next one gets the full gallery.
        if ($missing && $product->is_placeholder) {
            defer(fn () => self::download($missing, $local));
        }

        $urls = [];
        foreach ($local as $file) {
            if (is_file(public_path($file))) {
                $urls[] = asset($file);
            }
        }

        // Fall back to the list photo when nothing could be cached.
        return $urls ?: array_values(array_filter([$product->image_url]));
    }

    private static function download(array $sources, array $local): void
    {
        @mkdir(public_path(self::DIR), 0755, true);

        try {
            $responses = Http::pool(fn (Pool $pool) => array_map(
                fn ($src) => $pool->as($src)
                    ->timeout(8)
                    ->withHeaders(['Accept' => 'image/webp,image/*', 'User-Agent' => 'LCT-catalog-seed/1.0'])
                    ->get($src, ['width' => 900]),
                $sources,
            ));
        } catch (Throwable) {
            return; // page still renders with the list photo
        }

        foreach ($sources as $src) {
            $res = $responses[$src] ?? null;
            if ($res instanceof \Illuminate\Http\Client\Response && $res->successful() && str_starts_with((string) $res->header('Content-Type'), 'image/')) {
                $file = public_path($local[$src]);
                file_put_contents($file, $res->body());
                // The feed's photos come at full quality; saved smaller like the rest.
                $small = Photo::encode($file, 'webp', 900);
                if ($small !== null && strlen($small) < filesize($file)) {
                    file_put_contents($file, $small);
                }
            }
        }
    }
}
