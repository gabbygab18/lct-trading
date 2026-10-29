<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GalleryTest extends TestCase
{
    use RefreshDatabase;

    public function test_images_compress_shrinks_photos_in_place(): void
    {
        $tmp = sys_get_temp_dir().'/lct-compress-'.uniqid();
        @mkdir("$tmp/images/brands", 0777, true);
        @mkdir("$tmp/storage/app/public/uploads/products", 0777, true);
        $this->app->usePublicPath($tmp);
        $this->app->useStoragePath("$tmp/storage");

        $photo = imagecreatetruecolor(3000, 2000);
        for ($x = 0; $x < 3000; $x += 3) {
            imageline($photo, $x, 0, 3000 - $x, 2000, $x * 5000);
        }
        imagejpeg($photo, "$tmp/storage/app/public/uploads/products/phone.jpg", 98);
        imagewebp($photo, "$tmp/images/hero.webp", 100);
        imagewebp($photo, "$tmp/images/brands/logo.webp", 100);
        $logo = filesize("$tmp/images/brands/logo.webp");
        $hero = filesize("$tmp/images/hero.webp");

        $this->artisan('images:compress')->assertSuccessful();

        // Uploads: same name and format, cut to 1200px. Site photos keep their size; brand logos untouched.
        $this->assertSame([1200, 800, IMAGETYPE_JPEG], array_slice(getimagesize("$tmp/storage/app/public/uploads/products/phone.jpg"), 0, 3));
        $this->assertSame([3000, 2000], array_slice(getimagesize("$tmp/images/hero.webp"), 0, 2));
        $this->assertLessThan($hero, filesize("$tmp/images/hero.webp"));
        $this->assertSame($logo, filesize("$tmp/images/brands/logo.webp"));
        File::deleteDirectory($tmp);
    }

    public function test_feed_photos_come_from_the_cdn_sized_down(): void
    {
        $urls = array_map(fn ($i) => "https://cdn.shopify.com/s/files/p{$i}.jpg?v=1", range(1, 7));
        Product::create(['sku' => 'HM-01', 'name' => 'Hammer', 'brand' => 'Ingco', 'price' => 300, 'stock' => 3, 'is_active' => true,
            'is_placeholder' => true, 'gallery' => ['https://elsewhere.example/x.jpg', ...$urls]]);

        // At most five, other hosts left out, and nothing is downloaded to the server any more.
        $this->get('/shop/HM-01')->assertInertia(fn ($page) => $page
            ->has('product.gallery', 5)
            ->where('product.gallery.0', 'https://cdn.shopify.com/s/files/p1.jpg?v=1&width=700'));
    }

    public function test_admin_adds_and_removes_extra_photos(): void
    {
        Storage::fake('public');
        $p = Product::create(['sku' => 'FB-1212', 'name' => 'Fire Blanket', 'brand' => 'Best Guard', 'price' => 700, 'stock' => 5]);
        $form = ['sku' => 'FB-1212', 'name' => 'Fire Blanket', 'brand' => 'Best Guard', 'price' => 700, 'stock' => 5, 'is_active' => 1];

        $this->actingAs(User::factory()->create())
            ->put(route('admin.products.update', $p), $form + [
                'photos' => [UploadedFile::fake()->image('a.jpg', 3000, 2000), UploadedFile::fake()->image('b.jpg')],
            ])->assertSessionHasNoErrors();

        $gallery = $p->fresh()->ownGallery();
        $this->assertCount(2, $gallery);
        Storage::disk('public')->assertExists($gallery);

        // A phone-sized photo is saved as a 1200px WebP.
        $this->assertStringEndsWith('.webp', $gallery[0]);
        $this->assertSame([1200, 800], array_slice(getimagesizefromstring(Storage::disk('public')->get($gallery[0])), 0, 2));

        // The item page lists them after the main photo (none here, so just the two).
        $this->get('/shop/FB-1212')->assertInertia(fn ($page) => $page->has('product.gallery', 2));

        $this->put(route('admin.products.update', $p), $form + ['remove_gallery' => [$gallery[0]]]);
        $this->assertSame([$gallery[1]], $p->fresh()->ownGallery());
        Storage::disk('public')->assertMissing($gallery[0]);
    }
}
