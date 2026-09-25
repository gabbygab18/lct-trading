<?php

namespace Tests\Feature;

use App\Mail\InquiryReceived;
use App\Models\Inquiry;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InquiryTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_form_saves_and_emails_the_store(): void
    {
        Mail::fake();
        Setting::set('email', 'orders@lct.test');

        $this->from('/')->post('/inquiries', [
            'name' => 'Ana Reyes', 'phone' => '0917 123 4567', 'topic' => 'bulk',
            'message' => 'Need 40 pcs of RMB1P100C10 for a project in Laguna.',
        ])->assertRedirect('/')->assertSessionHas('inquiry_sent', 'Ana Reyes');

        $this->assertSame('bulk', Inquiry::sole()->topic);
        Mail::assertQueued(InquiryReceived::class, fn ($m) => $m->hasTo('orders@lct.test'));

        $this->actingAs(User::factory()->create())
            ->get(route('admin.inquiries.show', Inquiry::sole()))->assertOk()->assertSee('RMB1P100C10');
        $this->assertTrue(Inquiry::sole()->is_read);
    }

    public function test_bots_and_bad_input_are_turned_away(): void
    {
        $this->post('/inquiries', ['name' => 'x', 'phone' => '09171234567', 'topic' => 'other', 'message' => 'hello there', 'company_website' => 'spam.example']);
        $this->post('/inquiries', ['name' => '', 'phone' => 'abc', 'topic' => 'nope', 'message' => ''])
            ->assertSessionHasErrors(['name', 'phone', 'topic', 'message']);

        $this->assertSame(0, Inquiry::count());
    }
}
