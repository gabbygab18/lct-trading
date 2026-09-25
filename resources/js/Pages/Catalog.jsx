import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Shell from '@/components/Shell';
import Pocket from '@/components/Pocket';
import ListRow from '@/components/ListRow';
import { GridIcon, ListIcon } from '@/components/Icons';
import MenuSelect from '@/components/ui/menu-select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/animated-tabs';
import Button from '@/components/ui/Button';
import { CatalogSkeleton } from '@/components/Skeletons';
import { number, readStore, writeStore } from '@/lib/format';

const PARTIAL = { preserveState: true, preserveScroll: true, only: ['products', 'filters', 'categories'] };

function query(filters, patch) {
    const next = { ...filters, ...patch };
    Object.keys(next).forEach((k) => (next[k] === '' || next[k] == null || next[k] === 'featured') && delete next[k]);
    return next;
}

function BrandRail({ brands, filters }) {
    const { routes } = usePage().props;
    const total = brands.reduce((n, b) => n + b.count, 0);
    const tabs = [{ name: '', label: 'All brands', count: total }, ...brands.map((b) => ({ ...b, label: b.name }))];

    // The fill moves the moment you click; the list follows when the visit lands.
    const [brand, setBrand] = useState(filters.brand || '');
    useEffect(() => setBrand(filters.brand || ''), [filters.brand]);
    const choose = (name) => {
        setBrand(name);
        router.get(routes.catalog, query(filters, { brand: name, category: '', page: undefined }), { ...PARTIAL, preserveScroll: false });
    };

    return (
        <nav aria-label="Brands" className="-mx-3 overflow-x-auto px-3 sm:-mx-6 sm:px-6 [scrollbar-width:none] lg:overflow-visible">
            <Tabs value={brand} onValueChange={choose}>
                <TabsList aria-label="Brands" className="flex min-w-max gap-1.5 border-0 py-1 lg:min-w-0 lg:flex-wrap">
                    {tabs.map((b) => (
                        <TabsTrigger
                            key={b.label}
                            value={b.name}
                            fillClassName="rounded-[4px] bg-steel-100 dark:bg-steel-100" activeClassName="text-ink dark:text-ink"
                            className="h-10 rounded-[4px] px-3.5 text-[15px] font-semibold ring-1 ring-inset ring-foam-600 hover:bg-foam-700"
                        >
                            {b.label}
                            <span className={`text-[12px] font-normal ${brand === b.name ? 'text-steel-700' : 'text-steel-500'}`}>{number(b.count)}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </nav>
    );
}

function Pagination({ products, filters }) {
    const { routes } = usePage().props;
    const { current_page: page, last_page: last } = products;
    if (last <= 1) return null;

    const pages = [...new Set([1, page - 1, page, page + 1, last].filter((p) => p >= 1 && p <= last))].sort((a, b) => a - b);
    const link = (p, label, extra = '') => (
        <Link
            key={`${label}-${p}`}
            href={routes.catalog}
            data={query(filters, { page: p === 1 ? undefined : p })}
            only={PARTIAL.only}
            preserveState
            onSuccess={() => document.getElementById('results')?.scrollIntoView({ block: 'start' })}
            aria-current={p === page ? 'page' : undefined}
            className={`stamp grid h-10 min-w-10 place-items-center rounded-[3px] px-3 text-[15px] ${
                p === page ? 'plate' : 'text-steel-300 ring-1 ring-inset ring-foam-600 hover:bg-foam-700'
            } ${extra}`}
        >
            {label}
        </Link>
    );

    return (
        <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
            {page > 1 && link(page - 1, 'Prev')}
            {pages.map((p, i) => (
                <span key={p} className="flex items-center gap-1.5">
                    {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-steel-500">…</span>}
                    {link(p, number(p))}
                </span>
            ))}
            {page < last && link(page + 1, 'Next')}
        </nav>
    );
}

function Empty({ filters }) {
    const { routes, store } = usePage().props;
    return (
        <div className="flex flex-col items-center px-6 py-20 text-center">
            <i className="bx bx-search-alt text-[64px] text-foam-400" aria-hidden="true" />
            <h2 className="mt-6 font-display text-2xl font-black tracking-[-0.02em] text-steel-50">
                {filters.q ? <>Nothing matches “{filters.q}”</> : 'No items here yet'}
            </h2>
            <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-steel-400">
                Try fewer words, part of the SKU (e.g. <span className="stamp text-steel-200">485</span> instead of the full code), or search all brands.
                {store.phone && <> Still missing? We may have it in the store.</>}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button href={routes.catalog} variant="onBrandGhost" icon="bx-reset" layered className="stamp text-[15px]">
                    Clear search &amp; filters
                </Button>
                {store.phone && (
                    <Button href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} icon="bxs-phone" layered className="stamp text-[15px]">
                        Call {store.phone}
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function Catalog({ products, filters, brands, categories }) {
    const { routes } = usePage().props;
    const [view, setView] = useState('case');
    useEffect(() => setView(readStore('lct-view', 'case')), []);
    const pick = (v) => {
        setView(v);
        writeStore('lct-view', v);
    };
    // Skeleton while any visit back to the shop (brand, category, sort, page,
    // search) is loading; product-page visits don't count.
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const shopPath = new URL(routes.catalog).pathname;
        const offStart = router.on('start', (e) => {
            if (e.detail.visit.url.pathname === shopPath) setLoading(true);
        });
        const offFinish = router.on('finish', () => setLoading(false));
        return () => {
            offStart();
            offFinish();
        };
    }, [routes.catalog]);

    const update = (patch) => router.get(routes.catalog, query(filters, { ...patch, page: undefined }), { ...PARTIAL, replace: true });

    const heading = filters.q ? `“${filters.q}”` : filters.brand || 'Tools & hardware';
    const title = filters.q ? `Search: ${filters.q}` : filters.brand ? `${filters.brand} tools and hardware` : 'Catalog';

    return (
        <>
            <Head title={title} />
            <div className="px-3 pt-4 sm:px-6 sm:pt-5">
                <BrandRail brands={brands} filters={filters} />

                <div id="results" className="scroll-mt-[calc(var(--hdr)+80px)] mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-foam-600 pb-4">
                    <div className="min-w-0">
                        <h1 className="font-display text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-[0.95] tracking-[-0.03em] text-steel-50 break-words">
                            {heading}
                        </h1>
                        <p className="mt-2 text-[14px] text-steel-400">
                            {number(products.total)} {products.total === 1 ? 'item' : 'items'}
                            {filters.q && filters.brand && <> in {filters.brand}</>}
                            {filters.category && <> · {filters.category}</>}
                            {products.last_page > 1 && <> · page {number(products.current_page)} of {number(products.last_page)}</>}
                        </p>
                    </div>
                    <div className="grid w-full grid-cols-[1fr_1fr_auto] gap-2 sm:w-auto sm:grid-cols-[220px_190px_auto]">
                        <MenuSelect
                            label="Category"
                            value={filters.category}
                            onChange={(category) => update({ category })}
                            options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c.name, label: `${c.name} (${number(c.count)})` }))]}
                        />
                        <MenuSelect
                            label="Sort"
                            value={filters.sort}
                            onChange={(sort) => update({ sort })}
                            options={[
                                { value: 'featured', label: 'In stock first' },
                                { value: 'price_asc', label: 'Lowest price' },
                                { value: 'price_desc', label: 'Highest price' },
                                { value: 'name', label: 'Name A–Z' },
                            ]}
                        />
                        <Tabs value={view} onValueChange={pick}>
                            <TabsList aria-label="View" className="flex rounded-[4px] border-0 ring-1 ring-inset ring-foam-500">
                                {[
                                    ['case', GridIcon, 'Case view'],
                                    ['list', ListIcon, 'List view'],
                                ].map(([v, Icon, label]) => (
                                    <TabsTrigger key={v} value={v} aria-label={label} fillClassName="rounded-[4px] bg-steel-100 dark:bg-steel-100" activeClassName="text-ink dark:text-ink" className="grid h-10 w-10 place-items-center rounded-[4px] px-0 py-0">
                                        <Icon className="size-[18px]" />
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                <div className="pb-16 pt-4">
                    {loading ? (
                        <CatalogSkeleton view={view} count={Math.min(products.data.length || 10, 15)} />
                    ) : products.data.length === 0 ? (
                        <Empty filters={filters} />
                    ) : view === 'list' ? (
                        <ul className="divide-y divide-foam-600 overflow-hidden rounded-[6px] bg-foam-700/60 ring-1 ring-foam-600">
                            {products.data.map((p) => (
                                <ListRow key={p.id} product={p} />
                            ))}
                        </ul>
                    ) : (
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 min-[85rem]:grid-cols-5">
                            {products.data.map((p, i) => (
                                <Pocket key={p.id} product={p} priority={i < 8} />
                            ))}
                        </div>
                    )}
                    <Pagination products={products} filters={filters} />
                </div>
            </div>
        </>
    );
}

Catalog.layout = (page) => <Shell>{page}</Shell>;
