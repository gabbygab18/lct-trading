<?php

namespace App\Http\Controllers;

use App\Mail\InquiryReceived;
use App\Models\Inquiry;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Throwable;

class InquiryController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        // Bots fill every field; people never see this one.
        if (filled($request->input('company_website'))) {
            return back();
        }

        $data = $request->validate([
            'name'    => ['required', 'string', 'max:120'],
            'phone'   => ['required', 'string', 'max:30', 'regex:/^[0-9+()\-\s]{7,}$/'],
            'email'   => ['nullable', 'email', 'max:190'],
            'topic'   => ['required', Rule::in(array_keys(Inquiry::TOPICS))],
            'message' => ['required', 'string', 'min:5', 'max:2000'],
        ], [
            'name.required'    => 'Enter your name so we know who to ask for.',
            'phone.required'   => 'Enter a number we can call or text back.',
            'phone.regex'      => 'Enter a mobile or landline number, e.g. 0917 123 4567.',
            'email.email'      => 'That email doesn’t look right. Leave it blank if you prefer.',
            'message.required' => 'Tell us what you need.',
            'message.min'      => 'Tell us a little more so we can help.',
        ]);

        $inquiry = Inquiry::create($data);

        $recipient = Setting::get('email') ?: config('mail.orders_to');
        if (filled($recipient)) {
            try {
                // Queued, so the visitor never waits on the mail server.
                Mail::to($recipient)->queue(new InquiryReceived($inquiry));
            } catch (Throwable $e) {
                // Saved in the admin either way.
                Log::error('Inquiry notification failed to queue', ['inquiry' => $inquiry->id, 'error' => $e->getMessage()]);
            }
        }

        return back()->with('inquiry_sent', $data['name']);
    }
}
