<?php

namespace App\Mail;

use App\Models\Inquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InquiryReceived extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(public Inquiry $inquiry)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New inquiry: {$this->inquiry->topicLabel()} from {$this->inquiry->name}",
            replyTo: $this->inquiry->email ? [new Address($this->inquiry->email, $this->inquiry->name)] : [],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.inquiry-received');
    }
}
