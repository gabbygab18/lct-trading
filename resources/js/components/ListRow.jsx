import { Link } from '@inertiajs/react';
import Price from './Price';
import { CartAddIcon } from './BxIcons';
import { useRef } from 'react';
import { flyToTray, useTray } from '@/lib/tray';
import { money } from '@/lib/format';
import QtyStepper from './QtyStepper';
import StockNote from './StockNote';
import Button from './ui/Button';

/**
 * The price-sheet view for people who know what they want. Every cell is one
 * type size; rank comes from weight, case and the steel reversal on price.
 */
export default function ListRow({ product }) {
    const tray = useTray();
    const thumb = useRef(null);
    const qty = tray.qtyOf(product.id);
    const out = product.stock <= 0;

    return (
        <li className={`grid grid-cols-[48px_1fr_auto] items-center gap-x-3 gap-y-1 px-3 py-2.5 text-[14px] leading-snug md:grid-cols-[48px_150px_1fr_110px_120px_150px] ${out ? 'opacity-70' : ''}`}>
            <div className={`size-12 overflow-hidden rounded-[3px] ${out ? 'bg-signal-700' : qty ? 'taken bg-steel-100' : 'cut bg-steel-100'}`}>
                {product.image && (
                    <img ref={thumb} src={product.image} alt="" loading="lazy" width="48" height="48" className={`size-full object-contain p-0.5 mix-blend-multiply ${out ? 'opacity-40 grayscale' : ''}`} />
                )}
            </div>
            <div className="min-w-0 md:contents">
                <span className="stamp block truncate text-[14px] text-steel-50" title={product.sku}>{product.sku}</span>
                <span className="block truncate text-steel-300 md:whitespace-normal md:line-clamp-2" title=<Link href={product.url} className="hover:text-white hover:underline">{product.name}</Link>>
                    <span className="uppercase tracking-wide text-steel-500 md:hidden">{product.brand} · </span>
                    {product.name}
                </span>
                <span className="hidden uppercase tracking-wide text-steel-500 md:block">{product.brand}</span>
                <span className="block md:text-right">
                    <span className="inline-block rounded-[3px] bg-steel-200 px-1.5 py-1"><Price price={product.price} listPrice={product.listPrice} discount={product.discount} size="sm" /></span>{' '}
                    <StockNote stock={product.stock} className="md:mt-1 md:block" quiet="text-steel-400" tone="foam" />
                </span>
            </div>
            <div className="justify-self-end">
                {qty > 0 ? (
                    <QtyStepper value={qty} onChange={(n) => tray.setQty(product.id, n, product)} label={product.sku} tone="foam" size="sm" />
                ) : (
                    <Button
                        disabled={out}
                        onClick={() => {
                            tray.add(product, 1);
                            flyToTray(thumb.current, tray.target());
                        }}
                        icon={out ? undefined : <CartAddIcon />}
                        size="sm"
                        layered
                        className="stamp h-9 text-[14px] disabled:bg-foam-500 disabled:text-steel-400 disabled:opacity-100"
                        aria-label={out ? `${product.sku} is out of stock` : `Add ${product.sku} to tray`}
                    >
                        {out ? 'Out' : 'Add'}
                    </Button>
                )}
            </div>
        </li>
    );
}
