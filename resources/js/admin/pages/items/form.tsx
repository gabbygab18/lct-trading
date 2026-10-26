import { Button } from '@/components/glint/button';
import { Checkbox } from '@/components/glint/checkbox';
import { Input } from '@/components/glint/input';
import { Card, CardTitle, ConfirmButton, FieldError, Hint, Label, Textarea } from '@/admin/components/kit';
import { peso, safeBack } from '@/admin/lib/format';
import { Icon, Package } from '@/icons';
import { Link, router, useForm } from '@inertiajs/react';
import { useMemo, type FormEventHandler } from 'react';

interface Product {
    id: number;
    sku: string;
    name: string;
    brand: string;
    category: string | null;
    price: number;
    discount_percent: number;
    stock: number;
    description: string | null;
    is_active: boolean;
    image: string | null;
    image_url: string | null;
    gallery: { path: string; url: string }[];
    changed: string;
}

interface Props {
    product: Product | null;
    categories: string[];
    brands: string[];
    back: string | null;
}

const fileClass =
    'border-input text-muted-foreground hover:border-primary file:bg-foreground file:text-background hover:file:bg-primary block w-full cursor-pointer rounded-xl border border-dashed p-2.5 text-sm transition file:mr-3 file:h-9 file:cursor-pointer file:rounded-lg file:border-0 file:px-4 file:font-semibold file:transition hover:file:text-white';

export default function ItemForm({ product, categories, brands, back }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        sku: product?.sku ?? '',
        brand: product?.brand ?? '',
        name: product?.name ?? '',
        category: product?.category ?? '',
        price: product ? String(product.price) : '',
        discount_percent: product?.discount_percent ? String(product.discount_percent) : '',
        stock: product ? String(product.stock) : '0',
        description: product?.description ?? '',
        is_active: product?.is_active ?? true,
        photo: null as File | null,
        remove_photo: false,
        photos: [] as File[],
        remove_gallery: [] as string[],
        back: back ?? '',
        _method: product ? 'put' : 'post',
    });
    const listUrl = safeBack(back, '/admin/items');

    // "Customer pays ₱X" as you type the price or discount.
    const sale = useMemo(() => {
        const p = parseFloat(data.price) || 0;
        const d = Math.min(90, Math.max(0, parseFloat(data.discount_percent) || 0));
        return d > 0 && p > 0 ? `Customers see ${peso(p)} crossed out and pay ${peso(Math.round(p * (100 - d)) / 100)} (${d}% off).` : '';
    }, [data.price, data.discount_percent]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // Files need multipart; PUT goes as POST with _method, which Laravel reads.
        post(product ? `/admin/items/${product.id}` : '/admin/items', { forceFormData: true, preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
            <Card className="grid gap-5 sm:grid-cols-2">
                {product && <p className="text-muted-foreground text-sm sm:col-span-2">{product.changed}</p>}
                <div className="grid gap-2">
                    <Label htmlFor="sku">SKU / item code</Label>
                    <Input id="sku" required maxLength={64} value={data.sku} onChange={(e) => setData('sku', e.target.value)} error={errors.sku} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" required list="brand-options" value={data.brand} onChange={(e) => setData('brand', e.target.value)} error={errors.brand} />
                    <datalist id="brand-options">
                        {brands.map((b) => (
                            <option key={b} value={b} />
                        ))}
                    </datalist>
                </div>
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="name">Item name</Label>
                    <Input id="name" required value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" list="category-options" value={data.category} onChange={(e) => setData('category', e.target.value)} error={errors.category} />
                    <datalist id="category-options">
                        {categories.map((c) => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                    <div className="grid gap-2">
                        <Label htmlFor="price">Price (₱)</Label>
                        <Input id="price" required inputMode="decimal" className="text-right" value={data.price} onChange={(e) => setData('price', e.target.value)} error={errors.price} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="discount_percent">Discount (% off)</Label>
                        <Input
                            id="discount_percent"
                            inputMode="decimal"
                            placeholder="0"
                            value={data.discount_percent}
                            onChange={(e) => setData('discount_percent', e.target.value)}
                            error={errors.discount_percent}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" required inputMode="numeric" value={data.stock} onChange={(e) => setData('stock', e.target.value)} error={errors.stock} />
                    </div>
                    {sale && <p className="text-muted-foreground col-span-3 text-sm">{sale}</p>}
                </div>
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="description">
                        Description <span className="text-muted-foreground font-normal">(optional, for staff reference)</span>
                    </Label>
                    <Textarea id="description" rows={4} value={data.description} onChange={(e) => setData('description', e.target.value)} error={errors.description} />
                </div>
                <div className="sm:col-span-2">
                    <Checkbox
                        id="is_active"
                        label="Show in the catalog"
                        description="Untick to hide it from the shop without deleting it."
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                    />
                </div>
            </Card>

            <Card className="space-y-4">
                <CardTitle>Photo</CardTitle>
                <div className="bg-muted grid aspect-square place-items-center overflow-hidden rounded-2xl">
                    {data.photo ? (
                        <img src={URL.createObjectURL(data.photo)} alt="" className="size-full bg-white object-contain p-3" />
                    ) : product?.image_url && !data.remove_photo ? (
                        <img src={product.image_url} alt="" className="size-full bg-white object-contain p-3" />
                    ) : (
                        <span className="text-muted-foreground flex flex-col items-center gap-2 text-sm">
                            <Package className="size-8" />
                            No photo
                        </span>
                    )}
                </div>
                <input type="file" accept="image/*" className={fileClass} onChange={(e) => setData('photo', e.target.files?.[0] ?? null)} />
                <Hint>JPG, PNG or WebP up to 4 MB. A plain white background looks best.</Hint>
                {product?.image && <Checkbox label="Remove current photo" checked={data.remove_photo} onChange={(e) => setData('remove_photo', e.target.checked)} />}
                <FieldError message={errors.photo} />

                <div className="border-t pt-4">
                    <Label>
                        More photos <span className="text-muted-foreground font-normal">(optional, shown on the item page)</span>
                    </Label>
                    {product && product.gallery.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {product.gallery.map((g) => (
                                <div key={g.path} className="space-y-1">
                                    <span className="bg-muted grid aspect-square place-items-center overflow-hidden rounded-xl">
                                        <img src={g.url} alt="" className="size-full bg-white object-contain p-1.5" />
                                    </span>
                                    <Checkbox
                                        label={<span className="text-xs">Remove</span>}
                                        checked={data.remove_gallery.includes(g.path)}
                                        onChange={(e) =>
                                            setData('remove_gallery', e.target.checked ? [...data.remove_gallery, g.path] : data.remove_gallery.filter((x) => x !== g.path))
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <input type="file" accept="image/*" multiple className={`${fileClass} mt-3`} onChange={(e) => setData('photos', Array.from(e.target.files ?? []))} />
                    <p className="text-muted-foreground mt-2 text-xs">Pick several at once, up to 8 per save.</p>
                    <FieldError message={errors.photos ?? errors['photos.0']} />
                </div>
            </Card>

            <div className="flex flex-wrap items-center gap-2 xl:col-span-2">
                <Button type="submit" loading={processing} startIcon={<Icon name="save" className="size-4" />}>
                    {product ? 'Save item' : 'Add item'}
                </Button>
                <Link href={listUrl}>
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </Link>
                {product && (
                    <span className="ml-auto flex items-center gap-3">
                        <span className="text-muted-foreground hidden text-sm sm:inline">To hide it for now, untick “Show in the catalog”.</span>
                        <ConfirmButton
                            variant="ghost"
                            className="text-destructive"
                            startIcon={<Icon name="trash" className="size-4" />}
                            title={`Delete ${product.sku}?`}
                            description="Past orders keep their copy of it."
                            confirm="Delete item"
                            onConfirm={() => router.delete(`/admin/items/${product.id}`)}
                        >
                            Delete this item
                        </ConfirmButton>
                    </span>
                )}
            </div>
        </form>
    );
}
