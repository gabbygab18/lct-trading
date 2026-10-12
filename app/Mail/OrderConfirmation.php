<?php

namespace App\Mail;

use App\Models\Order;
use App\Support\Seo;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** The customer's copy, sent only when they gave an email. Replies go to the store. */
class OrderConfirmation extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(public Order $order)
    {
    }

    public function envelope(): Envelope
    {
        $store = Seo::store()['email'];

        return new Envelope(
            subject: "Order {$this->order->reference} received: we'll call to confirm",
            replyTo: $store ? [new Address($store, 'LCT Trading')] : [],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.order-confirmation');
    }
}
