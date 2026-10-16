import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { brandUrl } from '@/lib/urls';
import { CartIcon } from '@/components/BxIcons';
import { Link, usePage } from '@inertiajs/react';
import Button from '@/components/ui/Button';
import BrandFinder from '@/components/BrandFinder';

const Caret = () => <i className="bx bx-chevron-down caret" aria-hidden="true" />;

/**
 * Desktop Brands menu: opens on hover or click and holds a searchable list
 * (90+ brands no longer fit a dropdown). The panel sits under the header in a
 * portal, so the nav's link styles don't reach it.
 */
function BrandsMenu({ brands, current, hrefFor, allHref }) {
    const [open, setOpen] = useState(false);
    const timer = useRef(null);
    const trigger = useRef(null);
    const panel = useRef(null);
    const openNow = () => {
        window.clearTimeout(timer.current);
        setOpen(true);
    };
    const closeSoon = () => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setOpen(false), 200);
    };

    useEffect(() => {
        if (!open) return undefined;
        const away = (e) => {
            if (!panel.current?.contains(e.target) && !trigger.current?.contains(e.target)) setOpen(false);
        };
        const esc = (e) => {
            if (e.key !== 'Escape') return;
            setOpen(false);
            trigger.current?.focus();
        };
        document.addEventListener('pointerdown', away);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('pointerdown', away);
            document.removeEventListener('keydown', esc);
        };
    }, [open]);
    useEffect(() => () => window.clearTimeout(timer.current), []);

    return (
        <div className={`nav-item ${open ? 'open' : ''}`} onMouseEnter={openNow} onMouseLeave={closeSoon}>
            <a
                ref={trigger}
                href={allHref}
                role="button"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={(e) => {
                    e.preventDefault();
                    setOpen((v) => !v);
                }}
            >
                Brands
                <Caret />
            </a>
            {open &&
                createPortal(
                    <div
                        ref={panel}
                        role="dialog"
                        aria-label="Brands"
                        onMouseEnter={openNow}
                        onMouseLeave={closeSoon}
                        className="fixed right-4 top-[calc(var(--hdr)+6px)] z-[60] flex max-h-[min(640px,calc(100dvh-var(--hdr)-24px))] w-[min(860px,calc(100vw-32px))] flex-col rounded-[8px] bg-foam-800 p-4 shadow-[0_24px_60px_-12px_rgb(0_0_0/0.7)] ring-1 ring-foam-500"
                    >
                        <BrandFinder brands={brands} current={current} hrefFor={hrefFor} onPick={() => setOpen(false)} allHref={allHref} />
                    </div>,
                    document.body,
                )}
        </div>
    );
}

function useDesktop() {
    const query = '(min-width: 1025px)';
    const [desktop, setDesktop] = useState(() => typeof window === 'undefined' || window.matchMedia(query).matches);
    useEffect(() => {
        const mq = window.matchMedia(query);
        const onChange = () => setDesktop(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return desktop;
}

/** Phone/tablet menu section: expands in place instead of floating over the page. */
function MobileSection({ label, children }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`nav-acc ${open ? 'open' : ''}`}>
            <button type="button" className="nav-acc-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
                {label}
                <Caret />
            </button>
            <div className="nav-acc-panel">
                <div>{children}</div>
            </div>
        </div>
    );
}

/**
 * Site header, carried over from elnovian with LCT's nav. `actions` lets the
 * shop pages add their tray button beside the call-to-actions.
 */
export default function Header({ actions }) {
    const { props, component } = usePage();
    const { settings = {}, navBrands = [], routes, isHome } = props;
    const [menuOpen, setMenuOpen] = useState(false);

    const tel = (settings.phone || '').replace(/[^0-9+]/g, '');
    const onShop = ['Catalog', 'Checkout', 'OrderPlaced'].includes(component);

    useEffect(() => {
        const onResize = () => window.innerWidth > 1024 && setMenuOpen(false);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const closeAll = () => setMenuOpen(false);
    const desktop = useDesktop();
    const brandHref = (brand) => brandUrl(routes, brand);

    return (
        <header id="site-header" className={menuOpen ? 'open' : ''}>
            <div className="nav">
                <Link href={routes.home} className="brand" onClick={closeAll} aria-label="LCT Trading home">
                    <img src="/images/lct-mark.webp" alt="" width="39" height="45" className="h-11 w-auto" />
                    <span className="hidden flex-col leading-none sm:flex">
                        <span className="font-cond text-[24px] font-extrabold text-steel-50">LCT TRADING</span>
                        <span className="mt-1 border-t-2 border-signal pt-1 font-cond text-[10px] font-semibold uppercase tracking-[0.34em] text-steel-400">
                            Tools &amp; Hardware Supply
                        </span>
                    </span>
                </Link>

                <nav className="nav-links" aria-label="Main">
                    <Link href={routes.home} onClick={closeAll} aria-current={isHome ? 'page' : undefined}>
                        Home
                    </Link>
                    <Link href={routes.catalog} onClick={closeAll} aria-current={onShop ? 'page' : undefined}>
                        Shop
                    </Link>
                    {desktop ? (
                        <BrandsMenu brands={navBrands} current={props.filters?.brand} hrefFor={brandHref} allHref={routes.catalog} />
                    ) : (
                        <MobileSection label="Brands">
                            <BrandFinder
                                brands={navBrands}
                                current={props.filters?.brand}
                                hrefFor={brandHref}
                                onPick={closeAll}
                                allHref={routes.catalog}
                                className="max-h-[60dvh] px-1 pb-4 pt-2"
                            />
                        </MobileSection>
                    )}
                    <Link href={routes.howTo} onClick={closeAll} aria-current={component === 'HowToOrder' ? 'page' : undefined}>
                        How to order
                    </Link>
                    <Link href={routes.contact} onClick={closeAll} aria-current={component === 'Contact' ? 'page' : undefined}>
                        Contact
                    </Link>
                    {!desktop && tel && (
                        <a href={`tel:${tel}`} className="nav-mobile-call">
                            <i className="bx bxs-phone" aria-hidden="true" />
                            Call {settings.phone}
                        </a>
                    )}
                </nav>

                <div className="nav-cta">
                    {tel && (
                        <Button href={`tel:${tel}`} variant="onBrandGhost" size="sm" icon="bxs-phone" className="nav-call" layered>
                            Call us
                        </Button>
                    )}
                    {actions ?? (
                        <Button href={routes.catalog} variant="primary" size="sm" icon={<CartIcon />} className="nav-book" layered>
                            Shop now
                        </Button>
                    )}
                    <button
                        className="nav-toggle"
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((v) => !v)}
                    >
                        <i className={`bx ${menuOpen ? 'bx-x' : 'bx-menu'}`} aria-hidden="true" />
                    </button>
                </div>
            </div>
        </header>
    );
}
