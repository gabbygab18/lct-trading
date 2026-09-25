import { useEffect, useMemo, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Shell from '@/components/Shell';
import Button from '@/components/ui/Button';
import MenuSelect from '@/components/ui/menu-select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/animated-tabs';
import QtyStepper from '@/components/QtyStepper';
import { ArrowLeftIcon, TrashIcon, TruckIcon } from '@/components/Icons';
import { StoreIcon } from '@/components/BxIcons';
import { useTray } from '@/lib/tray';
import { money, plural, readStore, writeStore } from '@/lib/format';

const SAVED = 'lct-customer-v1';
const REMEMBER = ['customer_name', 'phone', 'email', 'fulfilment', 'address', 'address_line2', 'barangay', 'city', 'region', 'postal_code', 'shipping_preference', 'payment_preference'];

function Section({ title, children, aside }) {
    return (
        <section className="border-t border-foam-600 pt-6 first:border-t-0 first:pt-0">
            <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-steel-50">{title}</h2>
                {aside}
            </div>
            {children}
        </section>
    );
}

function Field({ label, name, form, optional, className = '', hint, ...input }) {
    const error = form.errors[name];
    const id = `f-${name}`;
    return (
        <div className={className}>
            <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-steel-300">
                {label}
                {optional && <span className="text-[12px] font-normal text-steel-500">optional</span>}
            </label>
            <input
                id={id}
                name={name}
                value={form.data[name] ?? ''}
                onChange={(e) => form.setData(name, e.target.value)}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
                className={`cut h-12 w-full rounded-[4px] px-3.5 text-[16px] text-steel-50 placeholder:text-steel-500 outline-none focus-visible:outline-2 focus-visible:outline-signal ${
                    error ? 'outline-2 outline-signal' : ''
                }`}
                {...input}
            />
            {hint && !error && <p id={`${id}-hint`} className="mt-1 text-[12.5px] text-steel-500">{hint}</p>}
            {error && <p id={`${id}-err`} className="mt-1 text-[13px] font-medium text-[#ff6b6f]">{error}</p>}
        </div>
    );
}

function Choice({ name, value, form, title, detail, meta, icon: Icon }) {
    const checked = form.data[name] === value;
    return (
        <label
            className={`flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors ${
                checked ? 'bg-steel-100 text-ink' : 'text-steel-200 hover:bg-foam-700'
            }`}
        >
            <input type="radio" name={name} value={value} checked={checked} onChange={() => form.setData(name, value)} className="mt-1 size-4 accent-[#d7141a]" />
            {Icon && <Icon className={`mt-0.5 size-5 shrink-0 ${checked ? 'text-signal' : 'text-steel-500'}`} />}
            <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{title}</span>
                {detail && <span className={`mt-0.5 block text-[13px] leading-snug ${checked ? 'text-steel-700' : 'text-steel-400'}`}>{detail}</span>}
            </span>
            {meta && <span className={`stamp shrink-0 text-[12px] ${checked ? 'text-steel-700' : 'text-steel-500'}`}>{meta}</span>}
        </label>
    );
}

function Slip({ tray, changed, priceNote }) {
    const savings = tray.items.reduce((n, i) => n + (i.listPrice && i.discount > 0 ? (i.listPrice - i.price) * i.qty : 0), 0);
    return (
        <div className="plate rounded-[6px] p-4 sm:p-5">
            <div className="flex items-baseline justify-between border-b border-ink/15 pb-3">
                <h2 className="stamp text-[20px]">Order slip</h2>
                <span className="text-[13px] text-steel-700">{plural(tray.count, 'pc')}</span>
            </div>
            {changed.length > 0 && (
                <p className="mt-3 rounded-[3px] bg-signal-soft px-3 py-2 text-[13px] leading-snug text-signal-700">
                    Updated since you added: {changed.join(', ')}. The slip shows today’s price and stock.
                </p>
            )}
            <ul className="divide-y divide-ink/10">
                {tray.items.map((i) => (
                    <li key={i.id} className="grid grid-cols-[40px_1fr_auto] items-start gap-3 py-3">
                        <div className="size-10 overflow-hidden rounded-[3px] bg-white/70">
                            {i.image && <img src={i.image} alt="" className="size-full object-contain mix-blend-multiply" />}
                        </div>
                        <div className="min-w-0">
                            <p className="stamp truncate text-[13px]">{i.sku}</p>
                            <p className="line-clamp-2 text-[12.5px] leading-snug text-steel-700">{i.name}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <QtyStepper value={i.qty} onChange={(n) => tray.setQty(i.id, n)} label={i.sku} size="sm" />
                                <button type="button" onClick={() => tray.remove(i.id)} className="grid size-8 place-items-center rounded-[3px] text-steel-700 hover:bg-steel-300/60 hover:text-signal-600" aria-label={`Remove ${i.sku}`}>
                                    <TrashIcon className="size-4" />
                                </button>
                            </div>
                            {i.stock <= 0 && <p className="mt-1 text-[12.5px] font-semibold text-signal-600">Out of stock: remove to send</p>}
                            {i.stock > 0 && i.qty > i.stock && <p className="mt-1 text-[12.5px] font-semibold text-signal-700">Only {i.stock} on hand; LCT will confirm the rest</p>}
                        </div>
                        <div className="text-right">
                            <p className="stamp text-[15px]">{money(i.price * i.qty)}</p>
                            <p className="text-[12px] text-steel-700">
                                {i.qty} × {i.listPrice && i.discount > 0 && <s className="mr-1">{money(i.listPrice)}</s>}
                                {money(i.price)}
                            </p>
                            {i.discount > 0 && <p className="stamp mt-0.5 text-[11.5px] text-signal">−{i.discount}% off</p>}
                        </div>
                    </li>
                ))}
            </ul>
            <dl className="space-y-1.5 border-t border-ink/15 pt-3 text-[14px]">
                <div className="flex justify-between">
                    <dt className="text-steel-700">Items</dt>
                    <dd className="stamp">{money(tray.subtotal + savings)}</dd>
                </div>
                {savings > 0 && (
                    <div className="flex justify-between">
                        <dt className="text-steel-700">Discounts</dt>
                        <dd className="stamp text-signal">−{money(savings)}</dd>
                    </div>
                )}
                <div className="flex justify-between">
                    <dt className="text-steel-700">Delivery</dt>
                    <dd className="stamp text-steel-700">To be confirmed</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-ink/15 pt-2">
                    <dt className="font-semibold">Subtotal</dt>
                    <dd className="stamp text-[26px] leading-none">{money(tray.subtotal)}</dd>
                </div>
            </dl>
            <p className="mt-3 flex gap-2 rounded-[4px] bg-white/60 px-3 py-2 text-[12.5px] leading-snug text-steel-800">
                <i className="bx bxs-badge-check mt-px text-[16px] text-signal" aria-hidden="true" />
                <span>{priceNote}</span>
            </p>
        </div>
    );
}

export default function Checkout({ fresh, shipping, payment, regions }) {
    const tray = useTray();
    const { routes, store } = usePage().props;
    const [changed, setChanged] = useState([]);
    const [remember, setRemember] = useState(true);

    // Fold today's price/stock into the tray and say what moved.
    useEffect(() => {
        if (!fresh) return;
        const moved = tray.items.filter((i) => !fresh[i.id] || fresh[i.id].price !== i.price || (fresh[i.id].stock <= 0) !== (i.stock <= 0)).map((i) => i.sku);
        setChanged(moved);
        tray.refresh(fresh);
    }, [fresh]); // eslint-disable-line react-hooks/exhaustive-deps

    const form = useForm({
        customer_name: '',
        phone: '',
        email: '',
        fulfilment: 'ship',
        address: '',
        address_line2: '',
        barangay: '',
        city: '',
        region: 'Metro Manila',
        postal_code: '',
        shipping_preference: 'courier',
        payment_preference: 'cod',
        notes: '',
        company_website: '',
    });

    useEffect(() => {
        const saved = readStore(SAVED, null);
        if (saved) form.setData((d) => ({ ...d, ...saved }));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const blocked = tray.items.some((i) => i.stock <= 0);
    const ship = form.data.fulfilment === 'ship';
    const itemErrors = useMemo(() => Object.entries(form.errors).filter(([k]) => k.startsWith('items')).map(([, v]) => v), [form.errors]);

    const submit = (e) => {
        e.preventDefault();
        if (remember) writeStore(SAVED, Object.fromEntries(REMEMBER.map((k) => [k, form.data[k]])));
        form.transform((d) => ({ ...d, items: tray.items.map((i) => ({ id: i.id, quantity: i.qty })) }));
        form.post(routes.orders, {
            preserveScroll: 'errors',
            onSuccess: () => tray.clear(),
            // The send button sits below the form on phones; bring the first
            // problem into view. Runs after React has painted the errors.
            onError: (errors) =>
                requestAnimationFrame(() => {
                    const first = Object.keys(errors)[0] ?? '';
                    const el = first.startsWith('items') ? document.querySelector('[data-form-error]') : document.getElementById(`f-${first}`);
                    el?.scrollIntoView({ block: 'center' });
                    if (el?.tagName === 'INPUT') el.focus({ preventScroll: true });
                }),
        });
    };

    if (tray.items.length === 0) {
        return (
            <>
                <Head title="Send order" />
                <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
                    <div className="cut h-24 w-40 rounded-[8px]" />
                    <h1 className="mt-6 font-display text-3xl font-black tracking-[-0.02em] text-steel-50">Your tray is empty</h1>
                    <p className="mt-2 text-steel-400">Add items from the catalog first, then come back here to send the order.</p>
                    <Button href={routes.catalog} icon="bx-left-arrow-alt" layered className="stamp mt-6 text-[16px]">
                        Back to the catalog
                    </Button>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Send order" />
            <div className="mx-auto max-w-[1200px] px-3 pb-20 pt-6 sm:px-6">
                <Link href={routes.catalog} className="inline-flex items-center gap-1.5 text-[14px] text-steel-400 hover:text-steel-100">
                    <ArrowLeftIcon className="size-4" /> Keep adding items
                </Link>
                <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-black leading-[0.95] tracking-[-0.03em] text-steel-50">Send your order</h1>
                <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-steel-400">
                    No payment here. LCT checks stock, then calls or texts you to confirm the total and delivery fee before anything ships.
                </p>

                <form onSubmit={submit} noValidate className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
                    <div className="space-y-8">
                        {itemErrors.length > 0 && (
                            <div data-form-error className="rounded-[4px] bg-signal-700 px-4 py-3 text-[14px] text-white" role="alert">
                                {itemErrors.map((m) => <p key={m}>{m}</p>)}
                            </div>
                        )}

                        <Section title="Contact">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field form={form} name="customer_name" label="Full name" autoComplete="name" required className="sm:col-span-2" />
                                <Field form={form} name="phone" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" required hint="We call or text this number to confirm." />
                                <Field form={form} name="email" label="Email" type="email" autoComplete="email" optional />
                            </div>
                        </Section>

                        <Section title="Delivery">
                            <Tabs value={form.data.fulfilment} onValueChange={(v) => form.setData('fulfilment', v)}>
                                <TabsList aria-label="Delivery or pickup" className="grid grid-cols-2 gap-1 rounded-[5px] border-0 bg-foam-900 p-1 ring-1 ring-inset ring-foam-600">
                                    {[
                                        ['ship', 'Deliver', TruckIcon],
                                        ['pickup', 'Pick up at store', StoreIcon],
                                    ].map(([v, label, Icon]) => (
                                        <TabsTrigger key={v} value={v} fillClassName="rounded-[4px] bg-steel-100 dark:bg-steel-100" activeClassName="text-ink dark:text-ink" className="h-12 rounded-[4px] text-[16px] font-semibold">
                                            <Icon className="size-5" /> {label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>

                            {ship ? (
                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <Field form={form} name="address" label="House no., street" autoComplete="address-line1" className="sm:col-span-2" placeholder="e.g. 12 Mabini St." />
                                    <Field form={form} name="address_line2" label="Building, unit, landmark" autoComplete="address-line2" optional className="sm:col-span-2" />
                                    <Field form={form} name="barangay" label="Barangay" autoComplete="address-level3" />
                                    <Field form={form} name="city" label="City / municipality" autoComplete="address-level2" />
                                    <div>
                                        <span id="f-region-label" className="mb-1.5 block text-[13px] font-medium text-steel-300">Region</span>
                                        <MenuSelect
                                            id="f-region"
                                            label="Region"
                                            value={form.data.region}
                                            onChange={(region) => form.setData('region', region)}
                                            options={regions.map((r) => ({ value: r, label: r }))}
                                            invalid={!!form.errors.region}
                                            className="h-12 bg-foam-900 text-[16px] text-steel-50 shadow-[inset_0_3px_7px_rgb(0_0_0/0.75)] ring-0 hover:bg-foam-900"
                                        />
                                        {form.errors.region && <p className="mt-1 text-[13px] font-medium text-[#ff6b6f]">{form.errors.region}</p>}
                                    </div>
                                    <Field form={form} name="postal_code" label="Postal code" inputMode="numeric" autoComplete="postal-code" optional />

                                    <fieldset className="sm:col-span-2">
                                        <legend className="mb-2 text-[13px] font-medium text-steel-300">How should it travel?</legend>
                                        <div className="divide-y divide-foam-600 overflow-hidden rounded-[5px] ring-1 ring-foam-600">
                                            {Object.entries(shipping).map(([value, title]) => (
                                                <Choice key={value} form={form} name="shipping_preference" value={value} title={title} meta="Fee to confirm" />
                                            ))}
                                        </div>
                                        {form.errors.shipping_preference && <p className="mt-1 text-[13px] font-medium text-[#ff6b6f]">{form.errors.shipping_preference}</p>}
                                    </fieldset>
                                </div>
                            ) : (
                                <div className="mt-5 rounded-[5px] bg-foam-700 px-4 py-4 text-[14px] leading-relaxed text-steel-300 ring-1 ring-foam-600">
                                    <p className="font-semibold text-steel-100">Pick up at LCT Trading</p>
                                    {store.address && <p>{store.address}</p>}
                                    {store.hours && <p>{store.hours}</p>}
                                    <p className="mt-1 text-steel-400">Wait for our call or text that your items are packed before you come over.</p>
                                </div>
                            )}
                        </Section>

                        <Section title="Payment">
                            <div className="divide-y divide-foam-600 overflow-hidden rounded-[5px] ring-1 ring-foam-600">
                                <Choice form={form} name="payment_preference" value="cod" title={payment.cod} detail="Pay the rider or at the counter when you receive the items." />
                                <Choice
                                    form={form}
                                    name="payment_preference"
                                    value="bank"
                                    title={payment.bank}
                                    detail={store.bank ? store.bank : 'We send the account details when we confirm your order.'}
                                />
                            </div>
                        </Section>

                        <Section title="Notes">
                            <label htmlFor="f-notes" className="sr-only">Notes for LCT</label>
                            <textarea
                                id="f-notes"
                                rows={3}
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder="Preferred delivery time, alternative items, who receives it…"
                                className="cut w-full rounded-[4px] px-3.5 py-3 text-[16px] text-steel-50 placeholder:text-steel-500 outline-none focus-visible:outline-2 focus-visible:outline-signal"
                            />
                            {/* bots fill this; people never see it */}
                            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" value={form.data.company_website} onChange={(e) => form.setData('company_website', e.target.value)} />
                            <label className="mt-4 flex items-center gap-2.5 text-[14px] text-steel-300">
                                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-[#d7141a]" />
                                Remember my details on this device
                            </label>
                        </Section>
                    </div>

                    <div className="space-y-4 lg:sticky lg:top-[calc(var(--hdr)+84px)]">
                        <Slip tray={tray} changed={changed} priceNote={store.priceNote} />
                        <Button
                            type="submit"
                            disabled={blocked}
                            loading={form.processing}
                            size="lg"
                            block
                            layered
                            className="stamp h-14 text-[19px] disabled:bg-foam-500 disabled:text-steel-400 disabled:opacity-100"
                        >
                            {form.processing ? 'Sending…' : blocked ? 'Remove out-of-stock items' : 'Send order request'}
                        </Button>
                        <p className="text-center text-[12.5px] leading-snug text-steel-500">
                            Sending doesn’t charge you. You’ll get an order number right away.
                        </p>
                    </div>
                </form>
            </div>
        </>
    );
}

Checkout.layout = (page) => <Shell dock={false}>{page}</Shell>;
