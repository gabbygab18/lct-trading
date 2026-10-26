<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class InquiryController extends Controller
{
    public function index()
    {
        return Inertia::render('inquiries/index', [
            'title'     => 'Inquiries',
            'inquiries' => Inquiry::latest()->paginate(30)->through(fn (Inquiry $q) => [
                'id'         => $q->id,
                'name'       => $q->name,
                'phone'      => $q->phone,
                'topic'      => $q->topicLabel(),
                'message'    => $q->message,
                'is_read'    => (bool) $q->is_read,
                'created_at' => $q->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function show(Inquiry $inquiry)
    {
        if (! $inquiry->is_read) {
            $inquiry->forceFill(['is_read' => true])->save();
        }

        return Inertia::render('inquiries/show', [
            'title'   => $inquiry->name,
            'inquiry' => [
                'id'         => $inquiry->id,
                'name'       => $inquiry->name,
                'phone'      => $inquiry->phone,
                'email'      => $inquiry->email,
                'topic'      => $inquiry->topicLabel(),
                'message'    => $inquiry->message,
                'created_at' => $inquiry->created_at->toIso8601String(),
            ],
        ]);
    }

    public function destroy(Inquiry $inquiry): RedirectResponse
    {
        $inquiry->delete();

        return redirect()->route('admin.inquiries.index')->with('success', 'Inquiry deleted.');
    }
}
