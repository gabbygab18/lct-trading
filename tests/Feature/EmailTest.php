<?php

namespace Tests\Feature;

use App\Mail\InquiryConfirmation;
use App\Mail\InquiryReceived;
use App\Mail\OrderConfirmation;
use App\Mail\OrderReceived;
use App\Models\Inquiry;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_gets_a_copy_when_they_leave_an_email_and_all_four_render(): void
    {
        Mail::fake();
        Setting::set('email', 'orders@lct.test');
        $p = Product::create(['sku' => 'NK-BUT-1', 'name' => 'Nam Kwang Max Safe Butane Gas 220g', 'brand' => 'Nam Kwang', 'price' => 75, 'stock' => 20]);

        $this->post('/orders', [
            'items' => [['id' => $p->id, 'quantity' => 4]],
            'customer_name' => 'Ana Reyes', 'phone' => '0917 123 4567', 'email' => 'ana@example.com',
            'fulfilment' => 'pickup', 'payment_preference' => 'cod',
        ])->assertSessionHasNoErrors();
        $this->post('/inquiries', [
            'name' => 'Ana Reyes', 'phone' => '0917 123 4567', 'email' => 'ana@example.com', 'topic' => 'bulk',
            'message' => 'May stock ba kayo ng 20 cases?',
        ]);

        $order = Order::with('items')->sole();
        $inquiry = Inquiry::sole();
        Mail::assertQueued(OrderConfirmation::class, fn ($m) => $m->hasTo('ana@example.com') && $m->hasReplyTo('orders@lct.test'));
        Mail::assertQueued(OrderReceived::class, fn ($m) => $m->hasTo('orders@lct.test') && $m->hasReplyTo('ana@example.com'));
        Mail::assertQueued(InquiryConfirmation::class, fn ($m) => $m->hasTo('ana@example.com'));
        Mail::assertQueued(InquiryReceived::class, fn ($m) => $m->hasTo('orders@lct.test'));

        // Every template renders, with the details that matter in it.
        $customer = (new OrderConfirmation($order))->render();
        $this->assertStringContainsString('Thanks, Ana. We got your order.', $customer);
        $this->assertStringContainsString($order->reference, $customer);
        $this->assertStringContainsString('₱300.00', $customer);
        $this->assertStringContainsString('Cash at pickup', $customer);
        $this->assertStringContainsString(route('admin.orders.show', $order), (new OrderReceived($order))->render());
        $this->assertStringContainsString('May stock ba kayo', (new InquiryConfirmation($inquiry))->render());
        $this->assertStringContainsString(route('admin.inquiries.show', $inquiry), (new InquiryReceived($inquiry))->render());
    }

    public function test_no_customer_email_means_no_customer_copy(): void
    {
        Mail::fake();
        Setting::set('email', 'orders@lct.test');
        $p = Product::create(['sku' => 'NK-BUT-4', 'name' => 'Butane x4', 'brand' => 'Nam Kwang', 'price' => 260, 'stock' => 5]);

        $this->post('/orders', [
            'items' => [['id' => $p->id, 'quantity' => 1]],
            'customer_name' => 'Ben', 'phone' => '0917 123 4567', 'fulfilment' => 'pickup', 'payment_preference' => 'cod',
        ])->assertSessionHasNoErrors();

        Mail::assertNotQueued(OrderConfirmation::class);
        Mail::assertQueued(OrderReceived::class);
    }

    public function test_admin_can_send_a_test_email_and_sees_smtp_errors(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.settings.edit'))->assertOk()->assertSee('Send a test email to');

        // Working mailer: success message.
        $this->from(route('admin.settings.edit'))->post(route('admin.settings.test-email'), ['to' => 'gab@example.com'])
            ->assertSessionHas('success');

        // Unreachable SMTP server: the error is shown, not swallowed.
        config(['mail.default' => 'smtp', 'mail.mailers.smtp.host' => '127.0.0.1', 'mail.mailers.smtp.port' => 1, 'mail.mailers.smtp.timeout' => 2]);
        $this->from(route('admin.settings.edit'))->post(route('admin.settings.test-email'), ['to' => 'gab@example.com'])
            ->assertSessionHas('error', fn ($e) => str_starts_with($e, 'Sending failed:'));
    }
}
