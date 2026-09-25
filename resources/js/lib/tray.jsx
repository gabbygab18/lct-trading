import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CartCheckIcon } from '@/components/BxIcons';
import { readStore, writeStore } from './format';
import { toast } from '@/components/ui/toast';

const KEY = 'lct-tray-v1';
const TrayContext = createContext(null);

/**
 * The tray is the cart. It lives in the browser (customers have no
 * accounts); the server re-reads every price when the order is sent.
 */
export function TrayProvider({ children }) {
    const [items, setItems] = useState(() => (typeof window === 'undefined' ? [] : readStore(KEY, [])));
    const [open, setOpen] = useState(false);
    const [pulse, setPulse] = useState(0);
    const targets = useRef(new Set());

    useEffect(() => writeStore(KEY, items), [items]);

    // Keep tabs in step: adding in one tab updates the tray in the other.
    useEffect(() => {
        const onStorage = (e) => e.key === KEY && setItems(readStore(KEY, []));
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const setQty = useCallback((id, qty, product) => {
        setItems((current) => {
            const n = Math.max(0, Math.min(999, Math.floor(Number(qty) || 0)));
            const exists = current.some((i) => i.id === id);
            if (n === 0) return current.filter((i) => i.id !== id);
            if (exists) return current.map((i) => (i.id === id ? { ...i, qty: n } : i));
            if (!product) return current;
            const { id: pid, sku, name, brand, price, listPrice, discount, image, stock, url } = product;
            return [...current, { id: pid, sku, name, brand, price, listPrice, discount, image, stock, url, qty: n }];
        });
    }, []);

    const add = useCallback(
        (product, qty = 1) => {
            const existing = items.find((i) => i.id === product.id);
            const total = (existing?.qty ?? 0) + qty;
            setQty(product.id, total, product);
            setPulse((p) => p + 1);
            // One toast, updated in place, so fast clicking doesn't stack ten.
            toast.success(`${product.sku} added to tray`, {
                id: 'tray-add',
                description: total > 1 ? `${total} pcs · ${product.name}` : product.name,
                duration: 2600,
                position: 'bottom',
                icon: <CartCheckIcon className="mt-0.5 text-[22px] text-signal" />,
                action: { label: 'View tray', onClick: () => setOpen(true) },
            });
        },
        [items, setQty],
    );

    /** Fold fresh price/stock from the server in; drop what is gone. */
    const refresh = useCallback((fresh) => {
        setItems((current) =>
            current
                .filter((i) => fresh[i.id])
                .map((i) => ({ ...i, ...fresh[i.id], qty: i.qty })),
        );
    }, []);

    const value = useMemo(() => {
        const count = items.reduce((n, i) => n + i.qty, 0);
        const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);
        return {
            items,
            count,
            subtotal,
            open,
            setOpen,
            pulse,
            add,
            setQty,
            refresh,
            remove: (id) => setQty(id, 0),
            clear: () => setItems([]),
            qtyOf: (id) => items.find((i) => i.id === id)?.qty ?? 0,
            // Elements an added item can fly into; the visible one wins.
            registerTarget: (el) => {
                if (!el) return;
                targets.current.add(el);
                return () => targets.current.delete(el);
            },
            target: () => [...targets.current].find((el) => el.offsetParent !== null && el.getClientRects().length),
        };
    }, [items, open, pulse, add, setQty, refresh]);

    return <TrayContext.Provider value={value}>{children}</TrayContext.Provider>;
}

export const useTray = () => useContext(TrayContext);

/**
 * The signature move: the product photo lifts out of its pocket and drops
 * into the tray. Skipped entirely under reduced motion.
 */
export function flyToTray(fromEl, toEl) {
    if (!fromEl || !toEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    if (!a.width || !b.width) return;

    const ghost = fromEl.cloneNode(true);
    Object.assign(ghost.style, {
        position: 'fixed',
        left: `${a.left}px`,
        top: `${a.top}px`,
        width: `${a.width}px`,
        height: `${a.height}px`,
        margin: 0,
        zIndex: 60,
        pointerEvents: 'none',
        objectFit: 'contain',
        borderRadius: '4px',
        background: '#ececea',
        mixBlendMode: 'normal',
    });
    document.body.appendChild(ghost);

    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const s = Math.max(0.12, Math.min(b.width / a.width, 0.3));

    ghost
        .animate(
            [
                { transform: 'translate(0,0) scale(1)', opacity: 1, filter: 'drop-shadow(0 0 0 rgb(0 0 0 / 0))' },
                { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 40}px) scale(${(1 + s) / 2}) rotate(-6deg)`, opacity: 1, filter: 'drop-shadow(0 14px 18px rgb(0 0 0 / 0.55))', offset: 0.35 },
                { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(0deg)`, opacity: 0.2, filter: 'drop-shadow(0 2px 2px rgb(0 0 0 / 0.4))' },
            ],
            { duration: 620, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' },
        )
        .finished.finally(() => ghost.remove());
}
