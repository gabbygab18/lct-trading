import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import Price from './Price';
import { router, usePage } from '@inertiajs/react';
import { money, number } from '@/lib/format';

/** "royu wd5" + "royu wd515" → typed part plain, the completion bold (as khmtools). */
function Completion({ text, typed }) {
    const t = typed.toLowerCase();
    if (!text.startsWith(t)) return <strong>{text}</strong>;
    return (
        <>
            <span className="font-normal">{text.slice(0, t.length)}</span>
            <strong>{text.slice(t.length)}</strong>
        </>
    );
}

/**
 * Search-as-you-type dropdown under a search input. Suggestions complete the
 * word being typed; products jump straight to the item page. Arrow keys move,
 * Enter picks, Esc closes; Enter with nothing highlighted searches the shop.
 *
 * Render-prop: children(inputProps) so each search box keeps its own look.
 */
export default function SearchSuggest({ value, onChange, onSearch, children, panelClassName = '' }) {
    const { routes } = usePage().props;
    const [data, setData] = useState({ suggestions: [], products: [], total: 0, q: '' });
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [loading, setLoading] = useState(false);
    const box = useRef(null);
    const listId = useId();

    const q = value.trim();

    // Fetch as you type: short debounce, and a stale reply never overwrites a newer one.
    useEffect(() => {
        if (q.length < 2) {
            setData({ suggestions: [], products: [], total: 0, q });
            setLoading(false);
            return;
        }
        const ctrl = new AbortController();
        setLoading(true);
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`${routes.suggest}?q=${encodeURIComponent(q)}`, {
                    signal: ctrl.signal,
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) setData({ ...(await res.json()), q });
            } catch {
                /* aborted or offline: keep the last list */
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        }, 140);
        return () => {
            clearTimeout(t);
            ctrl.abort();
        };
    }, [q, routes.suggest]);

    useEffect(() => setActive(-1), [data]);

    useEffect(() => {
        const onDown = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, []);

    const items = useMemo(
        () => [
            ...data.suggestions.map((s) => ({ kind: 'suggestion', key: `s-${s}`, text: s })),
            ...data.products.map((p) => ({ kind: 'product', key: `p-${p.id}`, product: p })),
        ],
        [data],
    );
    const show = open && q.length >= 2 && (items.length > 0 || (!loading && data.q === q));

    const pick = (item) => {
        setOpen(false);
        if (!item) return onSearch(value);
        if (item.kind === 'suggestion') {
            onChange(item.text);
            onSearch(item.text);
        } else {
            router.visit(item.product.url);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            if (!items.length) return;
            e.preventDefault();
            setOpen(true);
            const step = e.key === 'ArrowDown' ? 1 : -1;
            setActive((i) => {
                const n = i + step;
                return n < -1 ? items.length - 1 : n >= items.length ? -1 : n;
            });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            pick(active >= 0 ? items[active] : null);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const inputProps = {
        value,
        onChange: (e) => {
            onChange(e.target.value);
            setOpen(true);
        },
        onFocus: () => setOpen(true),
        onKeyDown,
        role: 'combobox',
        'aria-expanded': show,
        'aria-controls': listId,
        'aria-autocomplete': 'list',
        'aria-activedescendant': active >= 0 ? `${listId}-${active}` : undefined,
        autoComplete: 'off',
        spellCheck: false,
    };

    let index = -1;
    const option = (item, content, className) => {
        index += 1;
        const i = index;
        return (
            <li
                key={item.key}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={active === i}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(item)}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer ${active === i ? 'bg-steel-100' : ''} ${className}`}
            >
                {content}
            </li>
        );
    };

    return (
        <div ref={box} className="relative min-w-0 flex-1">
            {children(inputProps)}
            {show && (
                <div className={`lct-suggest absolute inset-x-0 top-[calc(100%+6px)] z-[60] overflow-hidden rounded-[8px] bg-white text-ink shadow-[0_18px_40px_-12px_rgb(0_0_0/0.55)] ring-1 ring-black/10 ${panelClassName}`}>
                    <ul id={listId} role="listbox" aria-label="Search suggestions" className="max-h-[min(70vh,560px)] overflow-y-auto overscroll-contain py-2">
                        {data.suggestions.length > 0 && (
                            <li role="presentation" className="px-4 pb-1 pt-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-steel-500">
                                Suggestions
                            </li>
                        )}
                        {data.suggestions.map((s) =>
                            option(
                                { kind: 'suggestion', key: `s-${s}`, text: s },
                                <span className="flex items-center gap-3 px-4 py-2 text-[15px]">
                                    <i className="bx bx-search text-[17px] text-steel-500" aria-hidden="true" />
                                    <span className="truncate">
                                        <Completion text={s} typed={q} />
                                    </span>
                                </span>,
                            ),
                        )}

                        {data.products.length > 0 && (
                            <li role="presentation" className="mt-1 border-t border-steel-200 px-4 pb-1 pt-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-steel-500">
                                Products
                            </li>
                        )}
                        {data.products.map((p) =>
                            option(
                                { kind: 'product', key: `p-${p.id}`, product: p },
                                <span className="grid grid-cols-[52px_1fr_auto] items-center gap-3 px-4 py-2.5">
                                    <span className="size-[52px] overflow-hidden rounded-[5px] bg-steel-100">
                                        {p.image && <img src={p.image} alt="" loading="lazy" className="size-full object-contain p-1 mix-blend-multiply" />}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-steel-500">{p.brand}</span>
                                        <span className="line-clamp-2 text-[14px] leading-snug">{p.name}</span>
                                    </span>
                                    <span className="text-right">
                                        <Price price={p.price} listPrice={p.listPrice} discount={p.discount} size="sm" tone="signal" stack />
                                        {p.stock <= 0 && <span className="block text-[11.5px] text-steel-500">Out of stock</span>}
                                    </span>
                                </span>,
                            ),
                        )}

                        {items.length === 0 && (
                            <li role="presentation" className="px-4 py-4 text-[14px] text-steel-700">
                                No items match “{q}”. Try part of the SKU or a shorter word.
                            </li>
                        )}
                    </ul>
                    {data.total > 0 && (
                        <button
                            type="button"
                            onPointerDown={(e) => e.preventDefault()}
                            onClick={() => pick(null)}
                            className="flex w-full items-center justify-between border-t border-steel-200 bg-steel-50 px-4 py-3 text-left text-[14px] font-semibold text-ink hover:bg-steel-100"
                        >
                            {data.total === 1 ? 'See the 1 result' : `See all ${number(data.total)} results`} for “{q}”
                            <i className="bx bx-right-arrow-alt text-[20px] text-signal" aria-hidden="true" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
