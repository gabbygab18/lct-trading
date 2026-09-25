import React, { useEffect, useRef, useState } from 'react';
import { CartIcon } from '@/components/BxIcons';
import { Link, usePage } from '@inertiajs/react';
import Button from '@/components/ui/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Caret = () => <i className="bx bx-chevron-down caret" aria-hidden="true" />;

/**
 * One nav dropdown (elnovian). Desktop opens on hover; below 1024px the label
 * is a tap target, since a touch screen has no hover.
 */
function NavDropdown({ label, href, onNavigate, wide = false, footer, children }) {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef(null);
    const hoverable = () => window.matchMedia('(min-width: 1025px)').matches;

    const openNow = () => {
        window.clearTimeout(closeTimer.current);
        if (hoverable()) setOpen(true);
    };

    const closeSoon = () => {
        if (!hoverable()) return;
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setOpen(false), 180);
    };

    useEffect(() => () => window.clearTimeout(closeTimer.current), []);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <div className={`nav-item ${open ? 'open' : ''}`} onMouseEnter={openNow} onMouseLeave={closeSoon}>
                <DropdownMenuTrigger className="rounded-none hover:shadow-none">
                    <a
                        href={href}
                        onClick={(e) => {
                            if (!hoverable()) {
                                e.preventDefault();
                                return;
                            }
                            setOpen(false);
                            onNavigate?.();
                        }}
                    >
                        {label}
                        <Caret />
                    </a>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align={wide ? 'center' : 'start'}
                    collisionPadding={16}
                    sideOffset={10}
                    maxHeight="none"
                    className={`nav-dropdown-panel ${wide ? 'nav-dropdown-wide' : ''}`}
                    onMouseEnter={openNow}
                    onMouseLeave={closeSoon}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                >
                    {children(() => setOpen(false))}
                    {footer?.(() => setOpen(false))}
                </DropdownMenuContent>
            </div>
        </DropdownMenu>
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

    const homeUrl = isHome ? '' : routes.home;
    const tel = (settings.phone || '').replace(/[^0-9+]/g, '');
    const onShop = ['Catalog', 'Checkout', 'OrderPlaced'].includes(component);

    useEffect(() => {
        const onResize = () => window.innerWidth > 1024 && setMenuOpen(false);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const closeAll = () => setMenuOpen(false);

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
                    <NavDropdown
                        label="Brands"
                        href={routes.catalog}
                        onNavigate={closeAll}
                        wide
                        footer={(close) => (
                            <DropdownMenuItem onSelect={close} className="nav-dropdown-all">
                                <Link href={routes.catalog} onClick={closeAll} className="flex w-full items-center justify-between gap-3">
                                    <span>Shop all brands</span>
                                    <i className="bx bx-right-arrow-alt text-[20px] text-signal" aria-hidden="true" />
                                </Link>
                            </DropdownMenuItem>
                        )}
                    >
                        {(close) =>
                            navBrands.map((brand) => (
                                <DropdownMenuItem key={brand} onSelect={close}>
                                    <Link
                                        href={`${routes.catalog}?brand=${encodeURIComponent(brand)}`}
                                        onClick={closeAll}
                                        className="flex w-full items-center justify-between gap-3"
                                        aria-current={props.filters?.brand === brand ? 'page' : undefined}
                                    >
                                        <span className={props.filters?.brand === brand ? 'text-white' : ''}>{brand}</span>
                                        {props.filters?.brand === brand && <i className="bx bx-check text-[18px] text-signal" aria-hidden="true" />}
                                    </Link>
                                </DropdownMenuItem>
                            ))
                        }
                    </NavDropdown>
                    <a href={`${homeUrl}#how`} onClick={closeAll}>
                        How to order
                    </a>
                    <a href={`${homeUrl}#contact`} onClick={closeAll}>
                        Contact
                    </a>
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
