<?php

/*
| Which proxies' X-Forwarded-* headers to believe (https scheme, visitor IP).
|
| - Laravel Cloud: null, and Laravel trusts its load balancer by itself.
| - Behind Cloudflare: TRUSTED_PROXIES=* in .env, so the order rate limiter
|   sees each visitor's IP, not Cloudflare's.
| - Otherwise: localhost only (a cloudflared tunnel on this PC).
*/

return [
    'proxies' => env('TRUSTED_PROXIES', laravel_cloud() ? null : '127.0.0.1,::1'),
];
