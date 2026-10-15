<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/** Cloudflare Turnstile: checks the "not a robot" token from the contact form. */
class Turnstile
{
    public static function enabled(): bool
    {
        return filled(config('services.turnstile.secret_key'));
    }

    public static function passes(?string $token, ?string $ip): bool
    {
        if (! self::enabled()) {
            return true;
        }
        if (blank($token)) {
            return false;
        }

        try {
            return (bool) Http::asForm()->timeout(5)
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => config('services.turnstile.secret_key'),
                    'response' => $token,
                    'remoteip' => $ip,
                ])->json('success');
        } catch (Throwable $e) {
            // Cloudflare unreachable: let the message through rather than lose a customer.
            Log::warning('Turnstile check skipped', ['error' => $e->getMessage()]);

            return true;
        }
    }
}
