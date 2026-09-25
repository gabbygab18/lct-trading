import { router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTray } from '@/lib/tray';
import { money, plural } from '@/lib/format';
import QtyStepper from './QtyStepper';
import { CloseIcon, TrashIcon } from './Icons';
import Button from './ui/Button';
import { BrowseIcon, PackageIcon } from './BxIcons';

const ease = [0.16, 1, 0.3, 1];

/** The tray's contents: the order slip being built. */
export default function TrayPanel({ onClose }) {
    const tray = useTray();
    const { props, component, url } = usePage();
    const { routes, store } = props;
    const savings = tray.items.reduce((n, i) => n + (i.listPrice && i.discount > 0 ? (i.listPrice - i.price) * i.qty : 0), 0);
    const checkoutUrl = `${routes.checkout}?ids=${tray.items.map((i) => i.id).join(',')}`;
    const reduce = useReducedMotion();
    const empty = tray.items.length === 0;

    // Let the sheet slide shut first, then change page, so the two motions don't collide.
    // Already on the unfiltered shop: nothing to load, just glide back to the top.
    const browse = () => {
        onClose?.();
        if (component === 'Catalog' && !url.includes('?')) {
            window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
            return;
        }
        window.setTimeout(() => router.visit(routes.catalog), onClose && !reduce ? 320 : 0);
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between border-b border-foam-600 px-4 py-3">
                <h2 className="stamp text-lg text-steel-50">
                    Tray <span className="text-steel-500">· {plural(tray.count, 'pc')}</span>
                </h2>
                {onClose && (
                    <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-[3px] text-steel-300 hover:bg-foam-600" aria-label="Close tray">
                        <CloseIcon />
                    </button>
                )}
            </div>

            {/* Last item out: the list fades away first, then the empty state settles in. */}
            <AnimatePresence mode="wait" initial={false}>
            {empty ? (
                <motion.div
                    key="empty"
                    className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-10 text-center"
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease }}
                >
                    {/* an empty cut, waiting for something to be dropped in */}
                    <motion.span
                        className="grid size-24 place-items-center rounded-full bg-foam-700"
                        initial={reduce ? false : { scale: 0.6, rotate: -12 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.08 }}
                    >
                        <PackageIcon className="text-[52px] text-foam-400" />
                    </motion.span>
                    <div>
                        <p className="stamp text-lg text-steel-50">Your tray is empty</p>
                        <p className="mx-auto mt-1 max-w-[28ch] text-sm leading-relaxed text-steel-400">
                            Hit <span className="stamp text-steel-200">Add to tray</span> on any item and it lands here.
                        </p>
                    </div>
                    <Button onClick={browse} variant="primary" size="sm" icon={<BrowseIcon />} layered className="mt-1">
                        Browse the shop
                    </Button>
                </motion.div>
            ) : (
                <motion.ul
                    key="list"
                    className="min-h-0 flex-1 divide-y divide-foam-600 overflow-y-auto overflow-x-hidden overscroll-contain"
                    exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.2 } }}
                >
                    <AnimatePresence initial={false}>
                    {tray.items.map((item) => (
                        <motion.li
                            key={item.id}
                            layout={!reduce}
                            className="grid grid-cols-[44px_1fr] gap-3 px-4 py-3"
                            initial={reduce ? false : { opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={reduce ? undefined : { opacity: 0, x: 60, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.3, ease } }}
                        >
                            <div className="cut size-11 overflow-hidden rounded-[3px] bg-steel-100">
                                {item.image && <img src={item.image} alt="" className="size-full object-contain p-0.5 mix-blend-multiply" loading="lazy" />}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="stamp truncate text-[13px] text-steel-50">{item.sku}</span>
                                    <span className="stamp num shrink-0 text-[15px] text-steel-50">{money(item.price * item.qty)}</span>
                                </div>
                                <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-steel-400">{item.name}</p>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <QtyStepper value={item.qty} onChange={(n) => tray.setQty(item.id, n)} label={item.sku} tone="foam" size="sm" />
                                    <span className="text-right text-[12px] text-steel-500">
                                        {item.listPrice && item.discount > 0 && <s className="mr-1">{money(item.listPrice)}</s>}
                                        {money(item.price)} each
                                        {item.discount > 0 && <span className="ml-1 font-semibold text-[#ff7a7e]">−{item.discount}%</span>}
                                    </span>
                                    <button type="button" onClick={() => tray.remove(item.id)} className="grid size-8 place-items-center rounded-[3px] text-steel-500 hover:bg-foam-600 hover:text-signal" aria-label={`Remove ${item.sku}`}>
                                        <TrashIcon className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.li>
                    ))}
                    </AnimatePresence>
                </motion.ul>
            )}
            </AnimatePresence>

            {/* No subtotal or disabled button over an empty tray. */}
            {!empty && (
            <div className="border-t border-foam-600 bg-foam-900/60 px-4 py-4">
                {savings > 0 && (
                    <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                        <span className="text-steel-400">You save</span>
                        <span className="stamp text-[#ff7a7e]">−{money(savings)}</span>
                    </div>
                )}
                <div className="flex items-baseline justify-between">
                    <span className="text-sm text-steel-400">Subtotal</span>
                    <span className="stamp text-2xl text-steel-50">{money(tray.subtotal)}</span>
                </div>
                <p className="mt-1 text-[12px] leading-snug text-steel-500">{store.priceNote} Delivery fee is confirmed at the same time.</p>
                <Button href={checkoutUrl} onClick={onClose} trailing="bx-right-arrow-alt" size="lg" block layered className="stamp mt-3 text-[17px]">
                    Send order request
                </Button>
            </div>
            )}
        </div>
    );
}
