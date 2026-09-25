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

        // A tunnel on this machine (cloudflared) forwards https visits from
        // localhost; honour its X-Forwarded-* so links and assets stay https.
        // Only localhost is trusted, so nobody can spoof their IP from outside.
        $middleware->trustProxies(at: ['127.0.0.1', '::1']);

        // Inertia powers the public catalog; the admin stays server-rendered Blade.
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
