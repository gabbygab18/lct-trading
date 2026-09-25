import { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Header from './Header';
import Footer from './Footer';
import ScrollTop from './ScrollTop';
import { useTray } from '@/lib/tray';
import { money, plural } from '@/lib/format';
import TrayPanel from './TrayPanel';
import SearchSuggest from './SearchSuggest';
import { SideSheet, SideSheetContent } from './ui/side-sheet';
import { toast } from './ui/toast';
import { SearchIcon } from './Icons';
import { CartIcon } from './BxIcons';

function SearchBar() {
    const { props, component } = usePage();
    const onCatalog = component === 'Catalog';
    const [q, setQ] = useState(props.filters?.q ?? '');
    const input = useRef(null);

    useEffect(() => setQ(props.filters?.q ?? ''), [props.filters?.q]);

    // "/" jumps to search from anywhere, as on most catalog tools.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
                e.preventDefault();
                input.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Full results in the shop, keeping the brand/category filters when already there.
    const search = (value) => {
        input.current?.blur();
        const params = { ...(onCatalog ? props.filters : {}), q: value.trim() || undefined, page: undefined };
        Object.keys(params).forEach((k) => (params[k] === '' || params[k] == null || params[k] === 'featured') && delete params[k]);
        router.get(props.routes.catalog, params, onCatalog ? { preserveState: true, only: ['products', 'filters', 'categories'] } : {});
    };

    return (
        <form role="search" className="relative flex min-w-0 flex-1" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="site-search" className="sr-only">Search items by name or SKU</label>
            <SearchSuggest value={q} onChange={setQ} onSearch={search}>
                {(inputProps) => (
                    <>
                        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-5 -translate-y-1/2 text-steel-500" />
                        <input
                            ref={input}
                            id="site-search"
                            type="search"
                            placeholder="Search by name or SKU"
                            className="cut h-12 w-full rounded-[5px] pl-11 pr-12 text-[16px] text-steel-50 placeholder:text-steel-500 outline-none focus-visible:outline-2 focus-visible:outline-signal"
                            {...inputProps}
                        />
                        <kbd className="stamp pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-[2px] border border-foam-500 px-1.5 text-[12px] text-steel-500 md:block">/</kbd>
                    </>
                )}
            </SearchSuggest>
        </form>
    );
}

function TrayButton() {
    const tray = useTray();
    const ref = useRef(null);
    useEffect(() => tray.registerTarget(ref.current), []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <button
            ref={ref}
            type="button"
            onClick={() => tray.setOpen(true)}
            className="relative flex h-10 shrink-0 items-center gap-2 rounded-[5px] bg-foam-700 px-3 text-steel-100 ring-1 ring-inset ring-foam-500 hover:bg-foam-600"
            aria-label={`Open tray, ${plural(tray.count, 'item')}`}
        >
            <CartIcon className="text-[22px]" />
            <span className="stamp hidden text-[15px] sm:inline">{money(tray.subtotal)}</span>
            {tray.count > 0 && (
                <span key={tray.pulse} className="stamp absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-[3px] bg-signal px-1 text-[12px] text-white animate-[flash-red_500ms]">
                    {tray.count > 99 ? '99+' : tray.count}
                </span>
            )}
        </button>
    );
}

/** The tray, as the @scrollxui side-sheet: slides in, drags out, Esc closes. */
function TraySheet() {
    const tray = useTray();
    // The add-to-tray toast would sit over the tray's own footer.
    useEffect(() => {
        if (tray.open) toast.dismiss('tray-add');
    }, [tray.open]);

    return (
        <SideSheet open={tray.open} onOpenChange={tray.setOpen} side="right" width="440px">
            <SideSheetContent className="rounded-none border-l border-foam-500 bg-foam-800 dark:bg-foam-800 text-steel-100 [&>div>div]:!p-0">
                <TrayPanel onClose={() => tray.setOpen(false)} />
            </SideSheetContent>
        </SideSheet>
    );
}

function MobileBar() {
    const tray = useTray();
    const ref = useRef(null);
    useEffect(() => tray.registerTarget(ref.current), []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-foam-500 bg-foam-800/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm sm:hidden ${tray.count === 0 ? 'hidden' : ''}`}>
            <button ref={ref} type="button" onClick={() => tray.setOpen(true)} className="btn-signal stamp flex h-12 w-full items-center justify-between rounded-[4px] px-4 text-[16px]">
                <span className="flex items-center gap-2">
                    <CartIcon className="text-[20px]" /> {plural(tray.count, 'pc')}
                </span>
                <span>{money(tray.subtotal)} · View tray</span>
            </button>
        </div>
    );
}

/** On phones the tray bar takes the bottom edge while it has items. */
function ShopScrollTop() {
    const tray = useTray();
    const [phone, setPhone] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)');
        const on = () => setPhone(mq.matches);
        on();
        mq.addEventListener('change', on);
        return () => mq.removeEventListener('change', on);
    }, []);
    return <ScrollTop lift={phone && tray.count > 0 ? 88 : 16} />;
}

export default function Shell({ children, dock = true }) {
    return (
        <div className="flex min-h-dvh flex-col">
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:bg-signal focus:px-3 focus:py-2 focus:text-white">
                Skip to items
            </a>
            {/* Same header as the homepage (elnovian's); the shop's search rail sits under it. */}
            <div className="el-site contents">
                <Header actions={dock ? <TrayButton /> : undefined} />
            </div>
            <div className="sticky top-[var(--hdr)] z-30 border-b border-foam-600 bg-foam-800/95 backdrop-blur-sm">
                <div className="mx-auto flex h-[68px] max-w-[1600px] items-center gap-3 px-3 sm:px-6">
                    <SearchBar />
                </div>
            </div>
            <div className="mx-auto w-full max-w-[1600px] flex-1">
                <main id="main" className="min-w-0">{children}</main>
            </div>
            <div className="el-site contents">
                <Footer />
            </div>
            <ShopScrollTop />
            {dock && <MobileBar />}
            {dock && <TraySheet />}
        </div>
    );
}
