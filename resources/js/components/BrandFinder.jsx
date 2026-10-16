import { useMemo, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { number } from '@/lib/format';

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Every brand, findable: a search box, the shop's popular brands, then all of
 * them A–Z by first letter. Used by the header's Brands menu (links) and the
 * shop's brand picker (onPick).
 *
 * brands: [{ name, count, top }]
 */
export default function BrandFinder({ brands, current = '', hrefFor, onPick, allHref, autoFocus = false, className = '' }) {
    const [q, setQ] = useState('');
    const input = useRef(null);
    const matches = useMemo(() => (q.trim() ? brands.filter((b) => fold(b.name).includes(fold(q.trim()))) : null), [brands, q]);
    const popular = brands.filter((b) => b.top);
    const groups = useMemo(() => {
        const by = {};
        [...brands]
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((b) => {
                const letter = /^[a-z]/i.test(b.name) ? b.name[0].toUpperCase() : '#';
                (by[letter] ??= []).push(b);
            });
        return Object.entries(by);
    }, [brands]);
    const total = brands.reduce((n, b) => n + b.count, 0);

    const item = (b, big = false) => {
        const on = current === b.name;
        const cls = `bf-item group flex w-full items-center justify-between gap-2 rounded-[4px] px-2.5 text-left transition-colors ${
            big ? 'h-11 bg-foam-700 ring-1 ring-inset ring-foam-600 hover:ring-foam-400' : 'h-9 hover:bg-foam-700'
        } ${on ? 'bg-signal/15 ring-1 ring-inset ring-signal' : ''}`;
        const body = (
            <>
                <span className={`truncate ${big ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'} ${on ? 'text-white' : 'text-steel-200 group-hover:text-white'}`}>{b.name}</span>
                <span className={`shrink-0 text-[12px] tabular-nums ${on ? 'text-steel-200' : 'text-steel-500 group-hover:text-steel-300'}`}>
                    {on ? <i className="bx bx-check text-[18px] text-signal" aria-hidden="true" /> : number(b.count)}
                </span>
            </>
        );
        return hrefFor ? (
            <Link key={b.name} href={hrefFor(b.name)} onClick={() => onPick?.(b.name)} className={cls} aria-current={on ? 'page' : undefined}>
                {body}
            </Link>
        ) : (
            <button key={b.name} type="button" onClick={() => onPick(b.name)} className={cls} aria-pressed={on}>
                {body}
            </button>
        );
    };

    return (
        <div className={`brand-finder flex min-h-0 flex-col ${className}`}>
            <label className="relative block shrink-0">
                <span className="sr-only">Find a brand</span>
                <i className="bx bx-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-steel-500" aria-hidden="true" />
                <input
                    ref={input}
                    type="search"
                    value={q}
                    autoFocus={autoFocus}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter' && matches?.length) {
                            e.preventDefault();
                            input.current?.closest('.brand-finder')?.querySelector('.bf-results .bf-item')?.click();
                        }
                    }}
                    placeholder={`Find a brand (${brands.length})`}
                    className="h-11 w-full rounded-[4px] bg-foam-900/60 pl-10 pr-3 text-[15px] text-steel-50 ring-1 ring-inset ring-foam-500 placeholder:text-steel-500 focus:outline-none focus:ring-2 focus:ring-signal"
                />
            </label>

            <div className="bf-results mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
                {matches ? (
                    matches.length ? (
                        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                            {matches.map((b) => (
                                item(b)
                            ))}
                        </div>
                    ) : (
                        <p className="px-1 py-6 text-center text-[14px] text-steel-400">No brand matches “{q}”.</p>
                    )
                ) : (
                    <>
                        {onPick && !hrefFor && (
                            <button
                                type="button"
                                onClick={() => onPick('')}
                                className={`bf-item mb-3 flex h-11 w-full items-center justify-between rounded-[4px] px-2.5 text-[15px] font-semibold ring-1 ring-inset ${
                                    current ? 'bg-foam-700 text-steel-200 ring-foam-600 hover:ring-foam-400' : 'bg-signal/15 text-white ring-signal'
                                }`}
                            >
                                All brands
                                <span className="text-[12px] font-normal text-steel-400">{number(total)}</span>
                            </button>
                        )}
                        {popular.length > 0 && (
                            <div role="group" aria-label="Popular brands">
                                <h3 className="mb-2 mt-0 px-1 font-cond text-[12px] font-bold uppercase tracking-[0.18em] text-steel-500">Popular</h3>
                                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                                    {popular.map((b) => (
                                        item(b, true)
                                    ))}
                                </div>
                            </div>
                        )}
                        <div role="group" aria-label="All brands A to Z" className="mt-4">
                            <h3 className="mb-1 mt-0 px-1 font-cond text-[12px] font-bold uppercase tracking-[0.18em] text-steel-500">All brands A–Z</h3>
                            <div className="columns-2 gap-x-4 sm:columns-3 lg:columns-4">
                                {groups.map(([letter, list]) => (
                                    <div key={letter} className="mb-2 break-inside-avoid">
                                        <p className="px-2.5 pb-0.5 pt-1.5 font-display text-[13px] font-black text-signal">{letter}</p>
                                        {list.map((b) => (
                                            item(b)
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {allHref && (
                <Link href={allHref} onClick={() => onPick?.('')} className="bf-item mt-3 flex shrink-0 items-center justify-between border-t border-foam-600 px-1 pt-3">
                    <span className="text-[15px] font-semibold text-white">Shop all {number(total)} items</span>
                    <i className="bx bx-right-arrow-alt text-[22px] text-signal" aria-hidden="true" />
                </Link>
            )}
        </div>
    );
}
