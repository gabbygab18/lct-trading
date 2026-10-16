import { useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import Shell from '@/components/Shell';
import BrandFinder from '@/components/BrandFinder';
import Pocket from '@/components/Pocket';
import ListRow from '@/components/ListRow';
import { GridIcon, ListIcon } from '@/components/Icons';
import MenuSelect from '@/components/ui/menu-select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/animated-tabs';
import Button from '@/components/ui/Button';
import { CatalogSkeleton } from '@/components/Skeletons';
import { number, readStore, writeStore } from '@/lib/format';

const PARTIAL = { preserveState: true, preserveScroll: true, only: ['products', 'filters', 'categories', 'seo', 'intro'] };

function query(filters, patch) {
    const next = { ...filters, ...patch };
    Object.keys(next).forEach((k) => (next[k] === '' || next[k] == null || next[k] === 'featured') && delete next[k]);
    return next;
}

/**
 * One row of brands: all, the popular ones and the current one, then "More
 * brands" for the searchable list of every brand (a wall of 90 chips was
 * unreadable).
 */
function BrandRail({ brands, filters }) {
    const { routes } = usePage().props;
    const total = brands.reduce((n, b) => n + b.count, 0);
    const shown = brands.filter((b) => b.top || b.name === filters.brand);
    const tabs = [{ name: '', label: 'All brands', count: total }, ...shown.map((b) => ({ ...b, label: b.name }))];

    // The fill moves the moment you click; the list follows when the visit lands.
    const [brand, setBrand] = useState(filters.brand || '');
    useEffect(() => setBrand(filters.brand || ''), [filters.brand]);
    const choose = (name) => {
        setMore(false);
        setBrand(name);
        router.get(routes.catalog, query(filters, { brand: name, category: '', page: undefined }), { ...PARTIAL, preserveScroll: false });
    };

    const [more, setMore] = useState(false);
    const wrap = useRef(null);
    useEffect(() => {
        if (!more) return undefined;
        const away = (e) => !wrap.current?.contains(e.target) && setMore(false);
        const esc = (e) => e.key === 'Escape' && setMore(false);
        document.addEventListener('pointerdown', away);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('pointerdown', away);
            document.removeEventListener('keydown', esc);
        };
    }, [more]);

    return (
        <div ref={wrap} className="relative">
            <div className="flex items-center gap-1.5">
                <nav aria-label="Popular brands" className="min-w-0 flex-1 overflow-x-auto [mask-image:linear-gradient(to_right,#000_92%,transparent)] [scrollbar-width:none]">
                    <Tabs value={brand} onValueChange={choose}>
                        <TabsList aria-label="Popular brands" className="flex min-w-max gap-1.5 border-0 py-1 pr-8">
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
                <button
                    type="button"
                    onClick={() => setMore((v) => !v)}
                    aria-expanded={more}
                    aria-haspopup="dialog"
                    className={`flex h-10 shrink-0 items-center gap-1.5 rounded-[4px] px-3.5 text-[15px] font-semibold ring-1 ring-inset transition-colors ${
                        more ? 'bg-foam-600 text-white ring-signal' : 'text-steel-100 ring-foam-500 hover:bg-foam-700'
                    }`}
                >
                    <i className="bx bx-search text-[18px]" aria-hidden="true" />
                    <span className="hidden sm:inline">All {brands.length} brands</span>
                    <span className="sm:hidden">Brands</span>
                    <i className={`bx bx-chevron-down text-[18px] text-steel-400 transition-transform ${more ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
            </div>
            {more && (
                <div
                    role="dialog"
                    aria-label="All brands"
                    className="absolute inset-x-0 top-[calc(100%+6px)] z-30 flex max-h-[min(560px,calc(100dvh-var(--hdr)-140px))] flex-col rounded-[8px] bg-foam-800 p-4 shadow-[0_24px_60px_-12px_rgb(0_0_0/0.7)] ring-1 ring-foam-500"
                >
                    <BrandFinder brands={brands} current={filters.brand} onPick={choose} autoFocus />
                </div>
            )}
        </div>
    );
}

/** What's narrowing the list, each removable on its own. */
function ActiveFilters({ filters }) {
    const { routes } = usePage().props;
    const chips = [
        filters.q && ['Search', `“${filters.q}”`, { q: '' }],
        filters.brand && ['Brand', filters.brand, { brand: '' }],
        filters.category && ['Category', filters.category, { category: '' }],
    ].filter(Boolean);
    if (!chips.length) return null;

    const drop = (patch) => router.get(routes.catalog, query(filters, { ...patch, page: undefined }), { ...PARTIAL, preserveScroll: false });

    return (
        <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Active filters">
            {chips.map(([label, value, patch]) => (
                <button
                    key={label}
                    type="button"
                    onClick={() => drop(patch)}
                    className="group flex h-8 items-center gap-1.5 rounded-full bg-foam-700 pl-3 pr-2 text-[13.5px] ring-1 ring-inset ring-foam-500 hover:ring-signal"
                    aria-label={`Remove ${label.toLowerCase()} ${value}`}
                >
                    <span className="text-steel-400">{label}:</span>
                    <span className="max-w-[24ch] truncate font-semibold text-steel-50">{value}</span>
                    <i className="bx bx-x text-[18px] text-steel-400 group-hover:text-signal" aria-hidden="true" />
                </button>
            ))}
            {chips.length > 1 && (
                <button type="button" onClick={() => drop({ q: '', brand: '', category: '' })} className="h-8 px-2 text-[13.5px] font-semibold text-steel-300 underline-offset-4 hover:text-white hover:underline">
                    Clear all
                </button>
            )}
        </div>
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

export default function Catalog({ products, filters, brands, categories, intro }) {
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

    const heading = filters.q ? `“${filters.q}”` : intro?.heading || filters.brand || 'Tools & hardware';

    return (
        <>
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
                            {intro && <> · updated {intro.updated}</>}
                        </p>
                        {intro && products.current_page === 1 && <p className="mt-3 max-w-[72ch] text-[14.5px] leading-relaxed text-steel-300">{intro.text}</p>}
                        <ActiveFilters filters={filters} />
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
                            prefix="Sort:"
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

                    {/* Same questions as this page's FAQ structured data. */}
                    {intro && products.current_page === 1 && (
                        <section className="mt-12 max-w-[820px] border-t border-foam-600 pt-8" aria-labelledby="listing-faq">
                            <h2 id="listing-faq" className="font-display text-[24px] font-black tracking-[-0.02em] text-steel-50">Questions about {filters.brand || filters.category}</h2>
                            <div className="mt-4 divide-y divide-foam-600">
                                {intro.faqs.map((f) => (
                                    <details key={f.q} className="group py-4">
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-steel-100 [&::-webkit-details-marker]:hidden">
                                            {f.q}
                                            <i className="bx bx-plus text-[20px] text-signal transition-transform group-open:rotate-45" aria-hidden="true" />
                                        </summary>
                                        <p className="mt-2 text-[14.5px] leading-relaxed text-steel-300">{f.a}</p>
                                    </details>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}

Catalog.layout = (page) => <Shell>{page}</Shell>;
