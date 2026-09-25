<?php

namespace Tests\Feature;

use App\Http\Controllers\SearchController;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchSuggestTest extends TestCase
{
    use RefreshDatabase;

    public function test_completes_the_word_being_typed(): void
    {
        $names = [
            'Royu WD515 3-Gang Switch with Reflector 10A (Wide)',
            'Royu WD511 1-Gang Switch with Reflector (Wide)',
            'Royu WD513 2-Gang Switch with Reflector 10A (Wide)',
        ];
        $out = SearchController::completions('royu wd5', $names);

        $this->assertContains('royu wd511', $out);
        $this->assertContains('royu wd515 3', $out);
        $this->assertNotContains('royu wd5', $out);
        foreach ($out as $s) {
            $this->assertStringStartsWith('royu wd5', $s);
            $this->assertDoesNotMatchRegularExpression('/ (with|for)$/', $s);
        }
    }

    public function test_endpoint_ranks_the_tool_over_its_parts(): void
    {
        $mk = fn ($sku, $name, $type, $stock = 5) => Product::create(['sku' => $sku, 'name' => $name, 'type' => $type,
            'brand' => 'Makita', 'brand_rank' => 3, 'price' => 100, 'stock' => $stock]);
        $mk('224502-4', 'Makita 224502-4 Sanding Lock Nut for Angle Grinder 4"', 'Lock Nut');
        $mk('9565C', 'Makita 9565C Angle Grinder 5"', 'Angle Grinder');
        $mk('X', 'Hidden grinder', 'Angle Grinder')->update(['is_active' => false]);

        $this->getJson('/search/suggest?q=grind')
            ->assertOk()
            ->assertJsonPath('total', 2)
            ->assertJsonPath('products.0.sku', '9565C')
            ->assertJsonPath('suggestions.0', 'grinder');

        $this->getJson('/search/suggest?q=g')->assertJsonPath('total', 0);
    }
}
