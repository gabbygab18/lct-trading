<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Baseline browser protections on every response. */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        if ($request->isSecure() && app()->isProduction()) {
            // Browsers then refuse plain http for a year (main domain only: cPanel/webmail subdomains are separate).
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }
        header_remove('X-Powered-By'); // don't advertise the PHP version

        return $response;
    }
}
