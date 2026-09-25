import { useRef, useState } from 'react';
import Price from './Price';
import { CartAddIcon, CartCheckIcon } from './BxIcons';
import { Link } from '@inertiajs/react';
import { flyToTray, useTray } from '@/lib/tray';
import { money } from '@/lib/format';
import QtyStepper from './QtyStepper';
import StockNote from './StockNote';
import Button from './ui/Button';

/**
 * One SKU sitting in its cut. Above: the photo on a steel insert. Below: the
 * stamped plate with SKU, price, stock and the add control. Once taken into
 * the tray the cut's rim shows red; out of stock, the whole cut is red foam.
 */
export default function Pocket({ product, priority = false }) {
    const tray = useTray();
    const img = useRef(null);
    const [flash, setFlash] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const qty = tray.qtyOf(product.id);
    const out = product.stock <= 0;

    const add = () => {
        tray.add(product, 1);
        flyToTray(img.current, tray.target());
        setFlash(true);
    };

    return (
        <article className="group flex flex-col rounded-[6px] bg-foam-700 p-2 shadow-[0_1px_0_rgb(255_255_255/0.04)_inset,0_6px_14px_-8px_rgb(0_0_0/0.8)] transition-transform duration-300 ease-out-expo focus-within:-translate-y-0.5 hover:-translate-y-0.5">
            {/* The photo opens the item too; the name link below is the one in the tab order. */}
            <Link
                href={product.url}
                tabIndex={-1}
                aria-hidden="true"
                className={`relative block aspect-[5/4] overflow-hidden rounded-[4px] ${
                    out ? 'bg-signal-700' : qty > 0 ? 'taken bg-steel-100' : 'cut bg-steel-100'
                } ${flash ? 'flash-red' : ''}`}
                onAnimationEnd={() => setFlash(false)}
            >
                {product.image && !loaded && <span className="lct-skel lct-skel-light absolute inset-0" aria-hidden="true" />}
                {product.image ? (
                    <img
                        ref={(el) => {
                            img.current = el;
                            if (el?.complete && el.naturalWidth && !loaded) setLoaded(true); // cached
                        }}
                        onLoad={() => setLoaded(true)}
                        onError={() => setLoaded(true)}
                        src={product.image}
                        alt=""
                        loading={priority ? 'eager' : 'lazy'}
                        decoding="async"
                        width="400"
                        height="400"
                        className={`relative size-full object-contain p-3 mix-blend-multiply transition-[transform,opacity] duration-500 ease-out-expo group-hover:scale-[1.03] ${!loaded ? 'opacity-0' : out ? 'opacity-35 grayscale mix-blend-luminosity' : 'opacity-100'}`}
                    />
                ) : (
                    <div ref={img} className="grid size-full place-items-center">
                        <span className="stamp text-xl text-steel-400">{product.brand}</span>
                    </div>
                )}
                {out && (
                    <span className="stamp absolute inset-x-0 bottom-3 text-center text-sm tracking-[0.2em] text-white">
                        Out of stock
                    </span>
                )}
                {qty > 0 && !out && (
                    <span className="stamp absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-[3px] bg-signal px-1.5 py-0.5 text-xs text-white">
                        <CartCheckIcon className="text-[14px]" />
                        {qty} in tray
                    </span>
                )}
            </Link>

            <div className="plate mt-2 flex flex-1 flex-col rounded-[4px] px-2.5 pb-2.5 pt-2">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="stamp truncate text-[13px] text-ink" title={product.sku}>
                        {product.sku}
                    </span>
                    <span className="stamp shrink-0 text-[11px] text-steel-700">{product.brand}</span>
                </div>
                <h3 className="mt-1 line-clamp-2 min-h-[2.5em] text-[13.5px] leading-[1.25] font-medium text-ink/90" title={product.name}>
                    <Link href={product.url} className="hover:underline hover:underline-offset-2">
                        {product.name}
                    </Link>
                </h3>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
                    <Price price={product.price} listPrice={product.listPrice} discount={product.discount} size="md" />
                    <StockNote stock={product.stock} className="whitespace-nowrap text-[11.5px] leading-none" quiet="text-steel-700" />
                </div>
                {/* mt-auto: the button sits on the card's bottom edge, so a row of cards
                    lines up even when one has a discount line and the next doesn't. */}
                <div className="mt-auto pt-2.5">
                    {qty > 0 ? (
                        <QtyStepper value={qty} onChange={(n) => tray.setQty(product.id, n, product)} label={product.sku} />
                    ) : (
                        <Button
                            onClick={add}
                            disabled={out}
                            icon={out ? undefined : <CartAddIcon />}
                            size="sm"
                            block
                            layered
                            className="stamp h-10 text-[15px] disabled:bg-foam-500 disabled:text-steel-400 disabled:opacity-100"
                        >
                            {out ? 'Out of stock' : 'Add to tray'}
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
}
