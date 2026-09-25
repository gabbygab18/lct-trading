import { useEffect, useRef, useState } from 'react';
import Price from '@/components/Price';
import { Head, Link, usePage } from '@inertiajs/react';
import Shell from '@/components/Shell';
import Pocket from '@/components/Pocket';
import QtyStepper from '@/components/QtyStepper';
import StockNote from '@/components/StockNote';
import Button from '@/components/ui/Button';
import { flyToTray, useTray } from '@/lib/tray';
import { money, readStore, writeStore } from '@/lib/format';
import { CartAddIcon, CartCheckIcon, PayIcon, StoreIcon } from '@/components/BxIcons';

function Crumbs({ product }) {
    const { routes } = usePage().props;
    const brandUrl = `${routes.catalog}?brand=${encodeURIComponent(product.brand)}`;
    return (
        <nav aria-label="Breadcrumb" className="text-[14px] text-steel-400">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li><Link href={routes.home} className="hover:text-white">Home</Link></li>
                <li aria-hidden="true"><i className="bx bx-chevron-right" /></li>
                <li><Link href={routes.catalog} className="hover:text-white">Shop</Link></li>
                <li aria-hidden="true"><i className="bx bx-chevron-right" /></li>
                <li><Link href={brandUrl} className="hover:text-white">{product.brand}</Link></li>
                <li aria-hidden="true"><i className="bx bx-chevron-right" /></li>
                <li aria-current="page" className="line-clamp-1 max-w-[46ch] text-steel-300">{product.name}</li>
            </ol>
        </nav>
    );
}

/** Long content folds behind "Read more". */
const FOLD = 400;

/** Long content folds behind "Read more"; opening and closing glide to height. */
function Folding({ html }) {
    const [open, setOpen] = useState(false);
    const [full, setFull] = useState(0);
    const box = useRef(null);
    const toggle = useRef(null);

    // Measure the full height now and whenever fonts/images/width change it.
    useEffect(() => {
        setOpen(false);
        const el = box.current;
        if (!el) return;
        const measure = () => setFull(el.scrollHeight);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el.firstElementChild ?? el);
        return () => ro.disconnect();
    }, [html]);

    const tall = full > FOLD + 20;
    const close = () => {
        setOpen(false);
        // Keep the button where the reader's eye is instead of leaving them
        // far below the text that just collapsed.
        requestAnimationFrame(() => toggle.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    };

    return (
        <>
            <div className="relative">
                <div
                    ref={box}
                    className="lct-fold overflow-hidden"
                    style={tall ? { maxHeight: open ? full : FOLD } : undefined}
                    aria-expanded={tall ? open : undefined}
                >
                    <div className="lct-prose" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
                {tall && (
                    <div
                        className={`pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-foam-800 to-transparent transition-opacity duration-500 ${
                            open ? 'opacity-0' : 'opacity-100'
                        }`}
                    />
                )}
            </div>
            {tall && (
                <button
                    ref={toggle}
                    type="button"
                    onClick={() => (open ? close() : setOpen(true))}
                    className="group mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-white hover:text-steel-200"
                >
                    <span className="underline decoration-steel-500 underline-offset-4 transition-colors group-hover:decoration-white">
                        {open ? 'Show less' : 'Read more'}
                    </span>
                    <i
                        className={`bx bx-chevron-down text-[18px] transition-transform duration-500 ease-out-expo ${open ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                    />
                </button>
            )}
        </>
    );
}

/**
 * Description first, then LCT's own policy tabs (Admin > Settings).
 * All HTML is cleaned on the server (SafeHtml): structure only.
 */
function InfoTabs({ description, tabs }) {
    const all = [...(description ? [{ key: 'description', label: 'Description', html: description }] : []), ...tabs];
    const [active, setActive] = useState(all[0]?.key);
    const refs = useRef({});
    if (!all.length) return null;
    const current = all.find((t) => t.key === active) ?? all[0];

    const onKey = (e, i) => {
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        const next = all[(i + step + all.length) % all.length];
        setActive(next.key);
        refs.current[next.key]?.focus();
    };

    return (
        <section className="mt-12 border-t border-foam-600 pt-8">
            <div role="tablist" aria-label="Product information" className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:justify-center">
                {all.map((t, i) => (
                    <button
                        key={t.key}
                        ref={(el) => (refs.current[t.key] = el)}
                        type="button"
                        role="tab"
                        id={`tab-${t.key}`}
                        aria-selected={t.key === current.key}
                        aria-controls={`panel-${t.key}`}
                        tabIndex={t.key === current.key ? 0 : -1}
                        onClick={() => setActive(t.key)}
                        onKeyDown={(e) => onKey(e, i)}
                        className={`shrink-0 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors ${
                            t.key === current.key ? 'text-white ring-1 ring-inset ring-steel-300' : 'text-steel-400 hover:text-steel-100'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <div role="tabpanel" id={`panel-${current.key}`} aria-labelledby={`tab-${current.key}`} className="mx-auto mt-6 max-w-[78ch]">
                <Folding html={current.html} />
            </div>
        </section>
    );
}

function Gallery({ product, photos, photoRef, inTray, out }) {
    const [index, setIndex] = useState(0);
    useEffect(() => setIndex(0), [product.id]);
    const current = photos[index] ?? product.image;

    return (
        <div className="min-w-0">
            <div className={`relative aspect-square overflow-hidden rounded-[8px] ${out ? 'bg-signal-700' : inTray ? 'taken bg-steel-100' : 'cut bg-steel-100'}`}>
                {current ? (
                    <img ref={photoRef} src={current} alt={product.name} className={`size-full object-contain p-6 mix-blend-multiply sm:p-10 ${out ? 'opacity-35 grayscale' : ''}`} />
                ) : (
                    <div ref={photoRef} className="grid size-full place-items-center">
                        <span className="stamp text-3xl text-steel-400">{product.brand}</span>
                    </div>
                )}
                {inTray > 0 && !out && (
                    <span className="stamp absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-[3px] bg-signal px-2 py-1 text-[13px] text-white"><CartCheckIcon className="text-[16px]" />{inTray} in tray</span>
                )}
                {photos.length > 1 && (
                    <>
                        <button type="button" onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-foam-800/80 text-white hover:bg-foam-800" aria-label="Previous photo">
                            <i className="bx bx-chevron-left text-[26px]" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => setIndex((i) => (i + 1) % photos.length)} className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-foam-800/80 text-white hover:bg-foam-800" aria-label="Next photo">
                            <i className="bx bx-chevron-right text-[26px]" aria-hidden="true" />
                        </button>
                    </>
                )}
            </div>
            {photos.length > 1 && (
                <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Photos">
                    {photos.map((src, i) => (
                        <li key={src}>
                            <button
                                type="button"
                                onClick={() => setIndex(i)}
                                aria-label={`Photo ${i + 1} of ${photos.length}`}
                                aria-current={i === index ? 'true' : undefined}
                                className={`block size-[72px] overflow-hidden rounded-[5px] bg-steel-100 ring-2 ${i === index ? 'ring-signal' : 'ring-transparent hover:ring-foam-400'}`}
                            >
                                <img src={src} alt="" loading="lazy" className="size-full object-contain p-1.5 mix-blend-multiply" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const RECENT = 'lct-recent-v1';

/** Items this browser opened before, newest first. Saved locally, nothing sent. */
function useRecentlyViewed(product) {
    const [items, setItems] = useState([]);
    useEffect(() => {
        const { description, gallery, brandLogo, tags, type, ...card } = product;
        const prev = readStore(RECENT, []).filter((p) => p.id !== product.id);
        setItems(prev.slice(0, 5));
        writeStore(RECENT, [card, ...prev].slice(0, 12));
    }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps
    return items;
}

export default function Product({ product, related, tabs = [], pickupNote }) {
    const tray = useTray();
    const { store } = usePage().props;
    const photo = useRef(null);
    const [qty, setQty] = useState(1);
    const inTray = tray.qtyOf(product.id);
    const out = product.stock <= 0;
    const recent = useRecentlyViewed(product);
    const { routes } = usePage().props;
    const shop = (params) => `${routes.catalog}?${new URLSearchParams(params)}`;

    const add = () => {
        tray.add(product, qty);
        flyToTray(photo.current, tray.target());
        setQty(1);
    };

    return (
        <>
            <Head title={`${product.name} (${product.sku})`}>
                <meta name="description" content={`${product.name}. ${product.brand}, SKU ${product.sku}, ${money(product.price)}. Order from LCT Trading.`} />
            </Head>

            <div className="mx-auto max-w-[1280px] px-3 pb-20 pt-5 sm:px-6">
                <Crumbs product={product} />

                <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
                    <Gallery product={product} photos={product.gallery ?? []} photoRef={photo} inTray={inTray} out={out} />

                    <div className="min-w-0">
                        {product.brandLogo ? (
                            <img src={product.brandLogo} alt={product.brand} className="h-12 w-auto max-w-[200px] rounded-[6px] sm:h-16 sm:max-w-[240px] bg-white object-contain px-3 py-2.5 shadow-[0_2px_8px_rgb(0_0_0/0.35)]" />
                        ) : (
                            <span className="stamp text-[15px] text-steel-400">{product.brand}</span>
                        )}

                        <h1 className="mt-4 font-display text-[clamp(1.6rem,3vw,2.4rem)] font-black leading-[1.1] tracking-[-0.025em] text-steel-50">{product.name}</h1>

                        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[14px] text-steel-400">
                            <div className="flex gap-2"><dt>SKU</dt><dd className="stamp text-steel-100">{product.sku}</dd></div>
                        </dl>

                        <div className="plate mt-6 rounded-[6px] px-5 py-4">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <Price price={product.price} listPrice={product.listPrice} discount={product.discount} size="lg" />
                                <StockNote stock={product.stock} className="text-[14px]" quiet="text-steel-700" />
                            </div>
                            <p className="mt-2 text-[13px] leading-snug text-steel-700">{store.priceNote} Delivery fee is confirmed at the same time.</p>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            {!out && <QtyStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} label={product.sku} tone="foam" />}
                            <Button
                                onClick={add}
                                disabled={out}
                                icon={out ? undefined : inTray ? <CartCheckIcon /> : <CartAddIcon />}
                                size="lg"
                                layered
                                className="stamp min-w-[220px] flex-1 text-[18px] disabled:bg-foam-500 disabled:text-steel-400 disabled:opacity-100"
                            >
                                {out ? 'Out of stock' : inTray ? `Add ${qty} more to tray` : 'Add to tray'}
                            </Button>
                        </div>
                        {inTray > 0 && (
                            <button type="button" onClick={() => tray.setOpen(true)} className="mt-3 text-[14px] font-semibold text-white underline underline-offset-4">
                                View tray ({inTray} of this item)
                            </button>
                        )}

                        <ul className="mt-7 space-y-3 text-[14px] leading-snug text-steel-300">
                            <li className="flex gap-3">
                                <StoreIcon className="mt-0.5 text-[20px] text-signal" />
                                <span>
                                    Store pickup{store.address ? <> at <strong className="text-steel-100">{store.address}</strong></> : ''}. We text you when it’s packed.
                                    {pickupNote && <span className="mt-0.5 block text-steel-400">{pickupNote}</span>}
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <i className="bx bxs-truck mt-0.5 text-[20px] text-signal" aria-hidden="true" />
                                <span>Delivery by courier, Lalamove, cargo or LCT. Fee confirmed with your order.</span>
                            </li>
                            <li className="flex gap-3">
                                <PayIcon className="mt-0.5 text-[20px] text-signal" />
                                <span>Nothing is charged online. Pay by cash on delivery or bank deposit after we confirm.</span>
                            </li>
                        </ul>

                        <dl className="mt-7 space-y-2 border-t border-foam-600 pt-5 text-[14px]">
                            <div className="flex gap-2">
                                <dt className="text-steel-400">Brand:</dt>
                                <dd><Link href={shop({ brand: product.brand })} className="text-steel-100 hover:underline">{product.brand}</Link></dd>
                            </div>
                            {product.type && (
                                <div className="flex gap-2">
                                    <dt className="text-steel-400">Type:</dt>
                                    <dd><Link href={shop({ q: product.type })} className="text-steel-100 hover:underline">{product.type}</Link></dd>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <dt className="text-steel-400">Availability:</dt>
                                <dd><StockNote stock={product.stock} tone="foam" quiet="text-steel-100" /></dd>
                            </div>
                            {product.category && (
                                <div className="flex gap-2">
                                    <dt className="text-steel-400">Category:</dt>
                                    <dd><Link href={shop({ category: product.category })} className="text-steel-100 hover:underline">{product.category}</Link></dd>
                                </div>
                            )}
                            {product.tags?.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <dt className="text-steel-400">Tags:</dt>
                                    {product.tags.map((t) => (
                                        <dd key={t}>
                                            <Link href={shop({ q: t })} className="inline-block rounded-full px-3 py-1 text-[13px] text-steel-200 ring-1 ring-inset ring-foam-500 hover:bg-foam-700 hover:text-white">
                                                {t}
                                            </Link>
                                        </dd>
                                    ))}
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                <InfoTabs description={product.description} tabs={tabs} />

                {related.length > 0 && (
                    <section className="mt-12 border-t border-foam-600 pt-8">
                        <h2 className="font-display text-[24px] font-black tracking-[-0.02em] text-steel-50">Similar items</h2>
                        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
                            {related.map((p) => (
                                <Pocket key={p.id} product={p} />
                            ))}
                        </div>
                    </section>
                )}

                {recent.length > 0 && (
                    <section className="mt-12 border-t border-foam-600 pt-8">
                        <h2 className="font-display text-[24px] font-black tracking-[-0.02em] text-steel-50">Recently viewed</h2>
                        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
                            {recent.map((p) => (
                                <Pocket key={p.id} product={p} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

Product.layout = (page) => <Shell>{page}</Shell>;
