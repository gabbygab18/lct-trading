<?php

use App\Support\Photo;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Same file names and formats, so nothing in the database changes. A file is
// only replaced when the new one is at least 5% smaller: safe to run again.
// Admin uploads (phone photos) are also cut to 1200px; site photos keep their size.
Artisan::command('images:compress', function () {
    [$before, $after, $changed] = [0, 0, 0];
    $folders = [[public_path('images'), null], [storage_path('app/public/uploads'), 1200]];

    foreach ($folders as [$dir, $max]) {
        if (! is_dir($dir)) {
            continue;
        }
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)) as $file) {
            $ext = strtolower($file->getExtension());
            // Brand logos are lossless on purpose; site PNGs are the logo mark.
            if (! in_array($ext, ['webp', 'jpg', 'jpeg', 'png'], true) || str_contains($file->getPathname(), 'brands')
                || ($ext === 'png' && $max === null)) {
                continue;
            }
            $old = $file->getSize();
            $new = Photo::encode($file->getPathname(), $ext === 'jpeg' ? 'jpg' : $ext, $max);
            $before += $old;
            if ($new !== null && strlen($new) < $old * 0.95) {
                file_put_contents($file->getPathname(), $new);
                $after += strlen($new);
                $changed++;
            } else {
                $after += $old;
            }
        }
    }

    $this->info(sprintf('%d files smaller: %.1f MB -> %.1f MB', $changed, $before / 1e6, $after / 1e6));
})->purpose('Re-save site photos and admin uploads smaller, in place');

// Shared hosting has no long-running worker: cron runs `schedule:run` every
// minute and this drains the mail queue, then exits.
Schedule::command('queue:work --stop-when-empty --tries=3 --max-time=50')
    ->everyMinute()
    ->withoutOverlapping();

// Catalog caches are versioned, so old entries are never read again; clear
// them nightly so the cache store doesn't keep growing.
Schedule::command('cache:clear')->dailyAt('03:00');
