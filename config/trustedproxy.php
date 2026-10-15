<?php

/*
| Which proxies' X-Forwarded-* headers to believe (https scheme, visitor IP).
|
| TRUSTED_PROXIES in .env:
| - cloudflare: only Cloudflare's own addresses (https://www.cloudflare.com/ips).
|   Use this behind Cloudflare: the server's IP is also reachable directly, and
|   "*" would let anyone fake their IP to dodge the login and order limits.
| - a comma list, or * (only if every request really comes through a proxy).
| - unset: Laravel Cloud trusts its load balancer by itself; elsewhere only a
|   local tunnel (cloudflared) on localhost.
*/

$cloudflare = [
    '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
    '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
    '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
    '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32',
    '2a06:98c0::/29', '2c0f:f248::/32',
];

$setting = env('TRUSTED_PROXIES');

return [
    'proxies' => match (true) {
        $setting === 'cloudflare' => $cloudflare,
        filled($setting) => $setting,
        default => laravel_cloud() ? null : '127.0.0.1,::1',
    },
];
