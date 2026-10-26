<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * One address per page: www and plain http move (301) to APP_URL's scheme and
 * host. Otherwise each of the four answers with its own canonical and Google
 * reports them as duplicates.
 */
class CanonicalHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $app = parse_url((string) config('app.url'));
        $host = $app['host'] ?? null;
        $https = ($app['scheme'] ?? '') === 'https';

        if (app()->isProduction() && $host && $request->isMethodSafe() && ! $request->is('up')
            && ($request->getHost() !== $host || ($https && ! $request->isSecure()))) {
            return redirect()->to(rtrim((string) config('app.url'), '/').$request->getRequestUri(), 301);
        }

        return $next($request);
    }
}
