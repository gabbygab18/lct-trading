<?php

namespace App\Support;

/** Re-encodes photos smaller with GD: admin uploads and `php artisan images:compress`. */
class Photo
{
    /**
     * The image at $path as $format ('webp', 'jpg' or 'png') bytes, no
     * longer than $max px on its long side; null if GD can't read it.
     * WebP at 75 and JPEG at 80 look the same as the originals on the shop.
     */
    public static function encode(string $path, string $format, ?int $max = null): ?string
    {
        $im = function_exists('imagewebp') ? @imagecreatefromstring((string) file_get_contents($path)) : false;
        if (! $im) {
            return null;
        }

        // Phones store photos sideways plus a "turn me" flag that GD ignores.
        $turn = function_exists('exif_read_data') ? (int) (@exif_read_data($path)['Orientation'] ?? 1) : 1;
        $im = match ($turn) {
            3 => imagerotate($im, 180, 0),
            6 => imagerotate($im, -90, 0),
            8 => imagerotate($im, 90, 0),
            default => $im,
        };
        imagepalettetotruecolor($im);
        [$w, $h] = [imagesx($im), imagesy($im)];
        if ($max && max($w, $h) > $max) {
            $im = imagescale($im, $w >= $h ? $max : (int) round($max * $w / $h));
        }
        imagealphablending($im, false);
        imagesavealpha($im, true);

        ob_start();
        match ($format) {
            'webp' => imagewebp($im, null, 75),
            'png' => imagepng($im, null, 9),
            default => imagejpeg($im, null, 80),
        };

        return ob_get_clean();
    }
}
