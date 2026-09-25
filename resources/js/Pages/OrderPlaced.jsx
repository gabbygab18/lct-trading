import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Shell from '@/components/Shell';
import Button from '@/components/ui/Button';
import { CheckIcon, PhoneIcon } from '@/components/Icons';
import { money, plural } from '@/lib/format';

export default function OrderPlaced({ order }) {
    const { routes, store } = usePage().props;
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(order.reference);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* clipboard blocked; the number is on screen */
        }
    };

    return (
        <>
            <Head title={`Order ${order.reference}`} />
            <div className="mx-auto max-w-[880px] px-3 pb-24 pt-8 sm:px-6 sm:pt-12">
                <p className="flex items-center gap-2 text-[15px] font-semibold text-steel-200">
                    <span className="grid size-6 place-items-center rounded-full bg-signal text-white"><CheckIcon className="size-4" /></span>
                    Order request sent, {order.name.split(' ')[0]}.
                </p>

                {/* The reference, stamped into a steel tag: what they read out on the phone. */}
                <div className="plate mt-5 rounded-[8px] px-5 py-6 sm:px-8 sm:py-8">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <h1 className="font-cond text-[clamp(2.6rem,9vw,5.2rem)] font-extrabold leading-[0.85] tracking-[0.01em] text-ink num" aria-label={`Order number ${order.reference}`}>{order.reference}</h1>
                        <button type="button" onClick={copy} className="stamp h-10 rounded-[3px] px-4 text-[14px] text-ink ring-1 ring-inset ring-ink/30 hover:bg-white/50">
                            {copied ? 'Copied' : 'Copy number'}
                        </button>
                    </div>
                    <p className="mt-4 border-t border-ink/15 pt-4 text-[14px] text-steel-700">
                        Order number · {order.placed_at} · {plural(order.item_count, 'pc')} · {money(order.subtotal)} before delivery
                    </p>
                </div>

                <section className="mt-10 grid gap-8 md:grid-cols-[1fr_1fr]">
                    <div>
                        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-steel-50">What happens next</h2>
                        <ol className="mt-4 space-y-4 text-[15px] leading-relaxed text-steel-300">
                            <li className="grid grid-cols-[28px_1fr] gap-2">
                                <span className="stamp text-[18px] text-steel-400">1</span>
                                <span>LCT checks stock for every item on your slip.</span>
                            </li>
                            <li className="grid grid-cols-[28px_1fr] gap-2">
                                <span className="stamp text-[18px] text-steel-400">2</span>
                                <span>
                                    We call or text <strong className="text-steel-100">{order.phone}</strong> to confirm prices and the final total
                                    {order.fulfilment === 'ship' ? ', including delivery' : ''}. Bulk orders may get an approved discount then.
                                </span>
                            </li>
                            <li className="grid grid-cols-[28px_1fr] gap-2">
                                <span className="stamp text-[18px] text-steel-400">3</span>
                                <span>
                                    {order.fulfilment === 'ship'
                                        ? `Once confirmed, it ships${order.shipping ? ` via ${order.shipping.split(',')[0]}` : ''}. You pay by ${order.payment.toLowerCase()}.`
                                        : `Pick up when we tell you it's packed. You pay by ${order.payment.toLowerCase()}.`}
                                </span>
                            </li>
                        </ol>
                        {store.phone && (
                            <a href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-steel-100 hover:text-white">
                                <PhoneIcon className="size-4 text-signal" /> Questions? Call {store.phone}
                            </a>
                        )}
                        {order.address && (
                            <p className="mt-6 text-[14px] leading-relaxed text-steel-400">
                                <span className="block text-steel-300">Delivering to</span>
                                {order.address}
                            </p>
                        )}
                    </div>

                    <div className="rounded-[6px] bg-foam-700 ring-1 ring-foam-600">
                        <h2 className="stamp border-b border-foam-600 px-4 py-3 text-[18px] text-steel-50">Your slip</h2>
                        <ul className="divide-y divide-foam-600">
                            {order.items.map((i) => (
                                <li key={i.sku} className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-[14px]">
                                    <span className="min-w-0">
                                        <span className="stamp block text-steel-100">{i.sku}</span>
                                        <span className="line-clamp-1 text-[13px] text-steel-400">
                                            {i.quantity} × {i.list_price && <s className="mr-1">{money(i.list_price)}</s>}{money(i.price)} · {i.name}
                                        </span>
                                    </span>
                                    <span className="stamp shrink-0 text-steel-100">{money(i.line_total)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex items-baseline justify-between border-t border-foam-600 px-4 py-3">
                            <span className="text-[14px] text-steel-400">Subtotal</span>
                            <span className="stamp text-[22px] text-steel-50">{money(order.subtotal)}</span>
                        </div>
                    </div>
                </section>

                <Button href={routes.catalog} variant="onBrandGhost" icon="bx-left-arrow-alt" layered className="stamp mt-12 text-[16px]">
                    Back to the catalog
                </Button>
            </div>
        </>
    );
}

OrderPlaced.layout = (page) => <Shell dock={false}>{page}</Shell>;
