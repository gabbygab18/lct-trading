<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class SettingController extends Controller
{
    /** Keys managed on the settings form, with their validation rules. */
    private const FIELDS = [
        'email'               => ['nullable', 'email', 'max:190'],
        'phone'               => ['nullable', 'string', 'max:60'],
        'viber'               => ['nullable', 'string', 'max:60'],
        'address'             => ['nullable', 'string', 'max:255'],
        'hours'               => ['nullable', 'string', 'max:120'],
        'facebook_url'        => ['nullable', 'url', 'max:255'],
        'bank_details'        => ['nullable', 'string', 'max:1000'],
        'low_stock_threshold' => ['nullable', 'integer', 'min:0', 'max:9999'],
        'pickup_note'         => ['nullable', 'string', 'max:255'],
        'price_note'          => ['nullable', 'string', 'max:255'],
        // Tabs on every product page; a tab with no text is not shown.
        'policy_warranty'     => ['nullable', 'string', 'max:5000'],
        'policy_shipping'     => ['nullable', 'string', 'max:5000'],
        'policy_returns'      => ['nullable', 'string', 'max:5000'],
        'policy_price_match'  => ['nullable', 'string', 'max:5000'],
        'policy_repair'       => ['nullable', 'string', 'max:5000'],
        'policy_per_order'    => ['nullable', 'string', 'max:5000'],
    ];

    public function edit()
    {
        return view('admin.settings.edit', ['settings' => Setting::map(), 'mail' => self::mailStatus()]);
    }

    /**
     * What the email setup looks like from the server: the SMTP settings in
     * use (never the password), who gets order emails, and whether queued
     * emails are going out. Pending mail that sits for minutes means the cron
     * isn't running.
     */
    private static function mailStatus(): array
    {
        $oldest = DB::table('jobs')->min('created_at');
        $failed = DB::table('failed_jobs')->latest('failed_at')->first();

        return [
            'mailer'    => config('mail.default'),
            'host'      => config('mail.mailers.smtp.host').':'.config('mail.mailers.smtp.port'),
            'username'  => config('mail.mailers.smtp.username'),
            'from'      => config('mail.from.address'),
            'recipient' => Setting::get('email') ?: config('mail.orders_to'),
            'pending'   => DB::table('jobs')->count(),
            'stuck'     => $oldest && now()->timestamp - $oldest > 180,
            'failed'    => DB::table('failed_jobs')->count(),
            'lastError' => $failed ? Str::limit(strtok((string) $failed->exception, "\n"), 300) : null,
        ];
    }

    /** Sends a plain email right now (not queued), so any SMTP error shows here. */
    public function testEmail(Request $request): RedirectResponse
    {
        $to = $request->validate(['to' => ['required', 'email', 'max:190']])['to'];

        try {
            Mail::raw("This is a test email from the LCT Trading website.\n\nIf you can read this, the site can send email.", function ($m) use ($to) {
                $m->to($to)->subject('LCT Trading: test email');
            });
        } catch (Throwable $e) {
            return back()->with('error', 'Sending failed: '.Str::limit($e->getMessage(), 300));
        }

        return back()->with('success', "Test email sent to {$to}. Check the inbox (and Spam).");
    }

    /** Sends the queued emails now, and retries failed ones: for when the cron isn't running yet. */
    public function runQueue(): RedirectResponse
    {
        try {
            Artisan::call('queue:retry', ['id' => ['all']]);
            Artisan::call('queue:work', ['--stop-when-empty' => true, '--tries' => 3, '--max-time' => 50]);
        } catch (Throwable $e) {
            return back()->with('error', 'Could not run the queue: '.Str::limit($e->getMessage(), 300));
        }
        $left = DB::table('jobs')->count();
        $failed = DB::table('failed_jobs')->count();

        return back()->with($failed ? 'error' : 'success', $failed
            ? "Ran the queue: {$failed} email(s) failed. See the error below."
            : "Queued emails sent.".($left ? " {$left} still waiting." : ''));
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate(self::FIELDS);

        foreach (array_keys(self::FIELDS) as $key) {
            Setting::set($key, isset($validated[$key]) ? (string) $validated[$key] : null);
        }

        return redirect()->route('admin.settings.edit')->with('success', 'Settings saved.');
    }
}
