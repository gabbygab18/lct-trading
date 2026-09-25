<?php

namespace Tests\Unit;

use App\Support\SafeHtml;
use PHPUnit\Framework\TestCase;

class SafeHtmlTest extends TestCase
{
    public function test_keeps_structure_and_drops_everything_else(): void
    {
        $html = SafeHtml::description('<p style="color:red" onclick="x()">Hi <b>there</b></p><script>alert(1)</script>'
            .'<a href="javascript:x">link</a><img src=x onerror=alert(1)><table><tr><td colspan="2" class="y">A</td></tr></table>');

        $this->assertSame('<p>Hi there</p>alert(1)link<table><tr><td colspan="2">A</td></tr></table>', $html);
        $this->assertStringNotContainsString('onclick', $html);
    }

    public function test_plain_text_becomes_escaped_paragraphs(): void
    {
        $this->assertSame('<p>Line one</p><p>&lt;b&gt; two</p>', SafeHtml::description("Line one\n\n<b> two"));
        $this->assertNull(SafeHtml::description('   '));
    }
}
