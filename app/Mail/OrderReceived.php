<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderReceived extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(public Order $order)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New order {$this->order->reference}: {$this->order->customer_name}, ₱".number_format((float) $this->order->subtotal, 2),
            replyTo: $this->order->email
                ? [new Address($this->order->email, $this->order->customer_name)]
                : [],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.order-received');
    }
}
