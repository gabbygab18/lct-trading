<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_privacy_policy_is_public_and_readable_without_javascript(): void
    {
        $html = $this->get('/privacy')->assertOk()->getContent();

        $this->assertStringContainsString('<title inertia>Privacy Policy | LCT Trading</title>', $html);
        $this->assertStringContainsString('<h2>Sahara Stocks and Google user data</h2>', $html);
        $this->assertStringContainsString('Limited Use requirements', $html);
        $this->assertStringContainsString(route('privacy'), $this->get('/sitemap.xml')->getContent());
    }
}
