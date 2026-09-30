<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GalleryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_adds_and_removes_extra_photos(): void
    {
        Storage::fake('public');
        $p = Product::create(['sku' => 'FB-1212', 'name' => 'Fire Blanket', 'brand' => 'Best Guard', 'price' => 700, 'stock' => 5]);
        $form = ['sku' => 'FB-1212', 'name' => 'Fire Blanket', 'brand' => 'Best Guard', 'price' => 700, 'stock' => 5, 'is_active' => 1];

        $this->actingAs(User::factory()->create())
            ->put(route('admin.products.update', $p), $form + [
                'photos' => [UploadedFile::fake()->image('a.jpg'), UploadedFile::fake()->image('b.jpg')],
            ])->assertSessionHasNoErrors();

        $gallery = $p->fresh()->ownGallery();
        $this->assertCount(2, $gallery);
        Storage::disk('public')->assertExists($gallery);

        // The item page lists them after the main photo (none here, so just the two).
        $this->get('/shop/FB-1212')->assertInertia(fn ($page) => $page->has('product.gallery', 2));

        $this->put(route('admin.products.update', $p), $form + ['remove_gallery' => [$gallery[0]]]);
        $this->assertSame([$gallery[1]], $p->fresh()->ownGallery());
        Storage::disk('public')->assertMissing($gallery[0]);
    }
}
