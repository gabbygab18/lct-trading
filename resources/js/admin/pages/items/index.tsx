import { Badge } from '@/components/glint/badge';
import { Button } from '@/components/glint/button';
import { Input } from '@/components/glint/input';
import { Select } from '@/components/glint/select';
import { StretchTabs } from '@/components/glint/stretch-tabs';
import { PageFooter } from '@/admin/components/kit';
import { ResponsiveTable } from '@/admin/components/responsive-table';
import { peso } from '@/admin/lib/format';
import type { Paginated } from '@/admin/lib/types';
import { Download, Package, Plus, Search } from '@/icons';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Item {
    id: number;
    sku: string;
    name: string;
    brand: string;
    category: string | null;
    price: number;
    discount_percent: number;
    sale_price: number;
    stock: number;
    is_active: boolean;
    is_placeholder: boolean;
    image_url: string | null;
}

type Filters = { q?: string; brand?: string; stock?: string };

const STOCK: Record<string, string> = { All: '', Low: 'low', Out: 'out', Hidden: 'hidden' };

/** Price, % off and stock straight in the row, the things that change daily. */
function QuickEdit({ item }: { item: Item }) {
    const [price, setPrice] = useState(String(item.price));
    const [off, setOff] = useState(item.discount_percent ? String(item.discount_percent) : '');
    const [stock, setStock] = useState(String(item.stock));
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        setPrice(String(item.price));
        setOff(item.discount_percent ? String(item.discount_percent) : '');
        setStock(String(item.stock));
    }, [item.price, item.discount_percent, item.stock]);
    const dirty = price !== String(item.price) || off !== (item.discount_percent ? String(item.discount_percent) : '') || stock !== String(item.stock);

    return (
        <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
                e.preventDefault();
                router.patch(
                    `/admin/items/${item.id}/quick`,
                    { price, discount_percent: off, stock },
                    { preserveScroll: true, preserveState: true, onStart: () => setSaving(true), onFinish: () => setSaving(false) },
                );
            }}
        >
            <div className="w-24 shrink-0">
                <Input size="sm" inputMode="decimal" aria-label={`Price of ${item.sku}`} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="w-16 shrink-0">
                <Input size="sm" inputMode="decimal" placeholder="0%" aria-label={`Discount for ${item.sku}`} value={off} onChange={(e) => setOff(e.target.value)} />
            </div>
            <div className="w-16 shrink-0">
                <Input size="sm" inputMode="numeric" aria-label={`Stock of ${item.sku}`} value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
            <Button size="sm" variant={dirty ? 'default' : 'outline'} loading={saving} type="submit">
                Save
            </Button>
        </form>
    );
}

export default function Items({ products, filters, brands, threshold }: { products: Paginated<Item>; filters: Filters; brands: string[]; threshold: number }) {
    const [q, setQ] = useState(filters.q ?? '');
    useEffect(() => setQ(filters.q ?? ''), [filters.q]);

    // Any filter change goes back to page 1; empty values are dropped from the URL.
    const go = (params: Filters) => {
        const next = Object.fromEntries(Object.entries({ ...filters, ...params }).filter(([, v]) => v));
        router.get('/admin/items', next, { preserveState: true, preserveScroll: true, replace: true });
    };
    const back = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';

    return (
        <div className="bg-card space-y-4 rounded-3xl p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
                <form
                    className="min-w-56 flex-1"
                    onSubmit={(e) => {
                        e.preventDefault();
                        go({ q });
                    }}
                >
                    <Input
                        type="search"
                        aria-label="Search items"
                        placeholder="Search name or SKU, then Enter"
                        startIcon={<Search className="size-4" />}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </form>
                <Select
                    aria-label="Brand"
                    className="w-56"
                    placeholder="All brands"
                    value={filters.brand ?? ''}
                    onValueChange={(brand) => go({ brand })}
                    options={[{ value: '', label: 'All brands' }, ...brands.map((b) => ({ value: b, label: b }))]}
                />
                <a href="/admin/items/export">
                    <Button variant="outline" startIcon={<Download className="size-4" />}>
                        Export
                    </Button>
                </a>
                <Button startIcon={<Plus className="size-4" />} onClick={() => router.visit('/admin/items/create')}>
                    Add item
                </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="-mx-1 max-w-full overflow-x-auto px-1 py-1">
                    <StretchTabs
                        className="whitespace-nowrap"
                        label="Stock"
                        options={Object.keys(STOCK)}
                        value={Object.keys(STOCK).find((k) => STOCK[k] === (filters.stock ?? ''))}
                        onChange={(v) => go({ stock: STOCK[v] })}
                    />
                </div>
                <p className="text-muted-foreground text-sm">Change price, % off or stock in the row, then Save. Low is {threshold} pcs or fewer.</p>
            </div>

            <ResponsiveTable
                selectable={false}
                rows={products.data}
                empty="No items match these filters."
                columns={[
                    {
                        key: 'name',
                        header: 'Item',
                        sortable: true,
                        cell: (i) => (
                            <Link prefetch href={`/admin/items/${i.id}/edit?back=${back}`} className={cn('group flex items-center gap-3', !i.is_active && 'opacity-60')}>
                                <span className="bg-muted grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl">
                                    {i.image_url ? (
                                        <img src={i.image_url} alt="" loading="lazy" className="size-full bg-white object-contain" />
                                    ) : (
                                        <Package className="text-muted-foreground size-5" />
                                    )}
                                </span>
                                <span className="min-w-0 whitespace-normal">
                                    <span className="group-hover:text-primary line-clamp-2 block max-w-sm font-medium">{i.name}</span>
                                    <span className="text-muted-foreground text-xs">
                                        {i.sku} · {i.brand}
                                    </span>
                                </span>
                            </Link>
                        ),
                    },
                    {
                        key: 'category',
                        header: 'Category',
                        sortable: true,
                        cell: (i) => <span className="text-muted-foreground text-xs uppercase">{i.category ?? '—'}</span>,
                    },
                    {
                        key: 'stock',
                        header: 'Status',
                        cell: (i) =>
                            !i.is_active ? (
                                <Badge variant="outline" dot>
                                    Hidden
                                </Badge>
                            ) : i.stock <= 0 ? (
                                <Badge variant="destructive" dot pulse>
                                    Out of stock
                                </Badge>
                            ) : i.stock <= threshold ? (
                                <Badge variant="warning" dot>
                                    Low
                                </Badge>
                            ) : (
                                <Badge variant="success" dot>
                                    In stock
                                </Badge>
                            ),
                    },
                    {
                        key: 'price',
                        header: 'Price · % off · Stock',
                        cell: (i) => (
                            <div>
                                <QuickEdit item={i} />
                                {(i.discount_percent > 0 || i.is_placeholder) && (
                                    <div className="mt-1 flex gap-1.5">
                                        {i.discount_percent > 0 && (
                                            <Badge size="sm" variant="destructive">
                                                −{i.discount_percent}% · {peso(i.sale_price)}
                                            </Badge>
                                        )}
                                        {i.is_placeholder && (
                                            <Badge size="sm" variant="secondary">
                                                Sample
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        ),
                    },
                ]}
            />

            <PageFooter page={products} noun="items" />
        </div>
    );
}
