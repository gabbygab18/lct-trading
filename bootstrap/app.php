<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn () => route('admin.login'));
        $middleware->redirectUsersTo(fn () => route('admin.dashboard'));

        // Honour X-Forwarded-* from the proxy in front of the app, so links and
        // assets are built as https (http links on an https page are blocked).
        // Laravel Cloud: its load balancer, the only way in, so trust any
        // address (what Laravel does by default there). Elsewhere: a local
        // tunnel (cloudflared) on localhost only.
        $middleware->trustProxies(at: laravel_cloud() ? '*' : ['127.0.0.1', '::1']);

        // Inertia powers the public catalog; the admin stays server-rendered Blade.
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
