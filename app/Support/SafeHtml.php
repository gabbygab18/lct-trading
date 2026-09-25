<?php

namespace App\Support;

/**
 * Product descriptions for the public page. Seeded ones arrive as cleaned
 * HTML; staff may type plain text in the admin. Either way only structural
 * tags survive, with no attributes except table spans.
 */
class SafeHtml
{
    private const TAGS = '<p><br><ul><ol><li><strong><em><h3><h4><h5><table><thead><tbody><tr><td><th><hr>';

    public static function description(?string $text): ?string
    {
        $text = trim((string) $text);
        if ($text === '') {
            return null;
        }

        // Plain text from the admin: one paragraph per line.
        if (! preg_match('#</?(p|br|ul|ol|li|strong|em|h[3-5]|table|tr|td|th)\b#i', $text)) {
            return collect(preg_split('/\R+/', $text))
                ->map(fn ($line) => trim($line))
                ->filter()
                ->map(fn ($line) => '<p>'.e($line).'</p>')
                ->implode('');
        }

        $html = strip_tags($text, self::TAGS);

        // Drop every attribute; keep a numeric colspan/rowspan on cells.
        return preg_replace_callback('/<(\w+)(\s[^>]*)?>/', function ($m) {
            $keep = '';
            if (in_array(strtolower($m[1]), ['td', 'th'], true) && isset($m[2])) {
                preg_match_all('/\b(colspan|rowspan)\s*=\s*"?(\d{1,2})"?/i', $m[2], $spans, PREG_SET_ORDER);
                foreach ($spans as $s) {
                    $keep .= ' '.strtolower($s[1]).'="'.$s[2].'"';
                }
            }

            return '<'.strtolower($m[1]).$keep.'>';
        }, $html);
    }
}
