<?php

return [
    // Tests check that a rendered page exists: the shop's pages (JSX) and the
    // admin's (TSX, its own React app).
    'testing' => [
        'ensure_pages_exist' => true,
        'page_paths' => [
            resource_path('js/Pages'),
            resource_path('js/admin/pages'),
        ],
        'page_extensions' => ['js', 'jsx', 'ts', 'tsx'],
    ],
];
