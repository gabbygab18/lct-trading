import { Badge } from '@/components/glint/badge';
import { LeanTip } from '@/components/glint/lean-tip';
import { NumberTicker } from '@/components/glint/number-ticker';
import { StretchTabs } from '@/components/glint/stretch-tabs';
import { Tally } from '@/components/glint/tally';
import { Card, CardTitle, ViewAll } from '@/admin/components/kit';
import { ResponsiveTable } from '@/admin/components/responsive-table';
import { fmt, pesoWhole, short, STATUS_LABEL, STATUS_VARIANT, peso, when } from '@/admin/lib/format';
import type { OrderRow } from '@/admin/lib/types';
import { ArrowUpRight, Info, Package, TrendingDown, TrendingUp, Truck } from '@/icons';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

interface LowItem {
    id: number;
    sku: string;
    name: string;
    brand: string;
    stock: number;
    image_url: string | null;
}

interface Props {
    month: { count: number; value: number };
    week: { count: number; before: number; value: number };
    statusWeek: { pending: number; confirmed: number; completed: number };
    daily: { date: string; count: number; value: number }[];
    monthly: { label: string; count: number; value: number }[];
    stock: { items: number; in: number; low: number; out: number; hidden: number };
    lowStock: LowItem[];
    recent: OrderRow[];
    pending: number;
    confirmed: number;
    placeholders: number;
    threshold: number;
}

const dayLabel = (iso: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${iso}T00:00:00`));

export default function Dashboard({ month, week, statusWeek, daily, monthly, stock, lowStock, recent, pending, confirmed, placeholders, threshold }: Props) {
    const [series, setSeries] = useState<'Orders' | 'Pesos'>('Orders');
    const key = series === 'Orders' ? 'count' : 'value';
    const monthMax = Math.max(1, ...monthly.map((m) => m[key]));
    const dayMax = Math.max(1, ...daily.map((d) => d.count));
    const statusMax = Math.max(1, statusWeek.pending, statusWeek.confirmed, statusWeek.completed);
    const change = week.before ? Math.round(((week.count - week.before) / week.before) * 100) : null;

    const tiles = [
        { label: 'In Stock', value: stock.in, href: '/admin/items', cls: 'from-emerald-400 to-emerald-600 text-white' },
        { label: 'Low Stock', value: stock.low, href: '/admin/items?stock=low', cls: 'from-amber-400 to-amber-600 text-white' },
        { label: 'Out of Stock', value: stock.out, href: '/admin/items?stock=out', cls: 'from-rose-400 to-rose-600 text-white' },
        { label: 'Hidden', value: stock.hidden, href: '/admin/items?stock=hidden', cls: 'from-slate-100 to-slate-200 text-slate-700', hint: 'Not shown in the shop' },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            {placeholders > 0 && (
                <div className="dark bg-background text-muted-foreground flex items-start gap-3 rounded-3xl px-5 py-4 text-sm leading-relaxed xl:col-span-12">
                    <Info className="mt-0.5 size-5 shrink-0" />
                    <p>
                        <strong className="text-foreground">{fmt(placeholders)} sample items are still live.</strong> They came from a public feed so the
                        site could be previewed. Replace them with LCT's own lists on{' '}
                        <Link href="/admin/items/import" className="text-foreground font-semibold underline">
                            Excel / CSV upload
                        </Link>
                        .
                    </p>
                </div>
            )}

            {/* Hero row */}
            <Card className="grid min-w-0 gap-5 md:grid-cols-[1fr_auto_1.3fr] xl:col-span-7">
                <div className="flex flex-col">
                    <CardTitle>Orders This Month</CardTitle>
                    <p className="font-display mt-auto text-5xl font-black tracking-tight tabular-nums">
                        <Tally to={month.count} duration={1400} />
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">{pesoWhole(month.value)} in order requests this month</p>
                </div>

                <div className="dark bg-background text-foreground flex min-w-44 flex-col rounded-2xl p-4 shadow-xl md:-my-2">
                    <div className="flex items-center gap-2.5">
                        <span className="bg-muted grid size-9 place-items-center rounded-full">
                            <Truck className="size-4" />
                        </span>
                        <span className="text-sm leading-tight">
                            Orders
                            <br />
                            this week
                        </span>
                    </div>
                    <NumberTicker value={week.count} variant="slate" className="font-display mt-4 self-start text-3xl" />
                    <p className={cn('mt-auto flex items-center gap-1 pt-3 text-xs', change !== null && change < 0 ? 'text-rose-400' : 'text-emerald-400')}>
                        {change === null ? (
                            'No orders last week'
                        ) : (
                            <>
                                {change >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />} {Math.abs(change)}% vs last week
                            </>
                        )}
                    </p>
                </div>

                <div className="flex flex-col">
                    <CardTitle action={<ViewAll href="/admin/orders" />}>Daily Orders</CardTitle>
                    <p className="text-muted-foreground text-xs">{pesoWhole(week.value)} ordered in the last 7 days</p>
                    <ul className="mt-3 flex h-24 items-end gap-1.5" aria-label="Orders per day, last 14 days">
                        {daily.map((d, i) => (
                            <li key={d.date} className="flex flex-1 justify-center">
                                {/* Pixel heights: LeanTip wraps the bar in an inline-flex span, so % heights would collapse. */}
                                <LeanTip
                                    glow="#d7141a"
                                    content={
                                        <span className="block text-center leading-tight">
                                            <span className="block text-xs opacity-70">{i === daily.length - 1 ? 'Today' : dayLabel(d.date)}</span>
                                            {fmt(d.count)} {d.count === 1 ? 'order' : 'orders'} · {pesoWhole(d.value)}
                                        </span>
                                    }
                                >
                                    <button
                                        type="button"
                                        aria-label={`${dayLabel(d.date)}: ${fmt(d.count)} ${d.count === 1 ? 'order' : 'orders'}, ${pesoWhole(d.value)}`}
                                        className="group flex w-3 cursor-default justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#d7141a]/50"
                                        style={{ height: Math.max(6, (d.count / dayMax) * 96) }}
                                    >
                                        <span
                                            className={cn(
                                                'h-full w-1.5 rounded-full transition-colors',
                                                i === daily.length - 1
                                                    ? 'bg-primary'
                                                    : 'bg-slate-200 group-hover:bg-red-300 group-focus-visible:bg-red-300 dark:bg-slate-700',
                                            )}
                                        />
                                    </button>
                                </LeanTip>
                            </li>
                        ))}
                    </ul>
                    <div className="text-muted-foreground mt-1 flex justify-between text-[10px]">
                        <span>{dayLabel(daily[0].date)}</span>
                        <span>Today</span>
                    </div>
                </div>
            </Card>

            <div className="grid min-w-0 gap-4 xl:col-span-5">
                <Link
                    href="/admin/items"
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#d7141a] to-[#8f0b10] p-5 text-white shadow-sm transition hover:brightness-105"
                >
                    <p className="font-display text-4xl font-black tracking-tight tabular-nums">
                        <Tally to={stock.items} duration={1200} />
                    </p>
                    <p className="mt-1 text-red-100">Items in the shop</p>
                    <Package className="absolute top-4 right-5 size-16 opacity-20" />
                </Link>
                <div className="grid grid-cols-4 gap-3">
                    {tiles.map((t) => (
                        <Link
                            key={t.label}
                            href={t.href}
                            title={t.hint}
                            className={cn(
                                'relative flex min-h-36 flex-col overflow-hidden rounded-2xl bg-gradient-to-b p-3 text-center transition hover:-translate-y-0.5',
                                t.cls,
                            )}
                        >
                            <span className="font-display text-xl font-black tabular-nums sm:text-2xl">
                                <Tally to={t.value} duration={1000} />
                            </span>
                            <span className="text-[11px] leading-tight opacity-90">{t.label}</span>
                            <span className="absolute inset-x-2 -bottom-6 h-14 rounded-t-full bg-white/25" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Second row */}
            <div className="grid min-w-0 content-start gap-4 xl:col-span-5">
                <Card>
                    <CardTitle action={<ViewAll href="/admin/orders" />}>This Week</CardTitle>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'To confirm', value: statusWeek.pending, href: '/admin/orders?status=pending', bar: 'from-amber-200 to-amber-500' },
                            { label: 'Confirmed', value: statusWeek.confirmed, href: '/admin/orders?status=confirmed', bar: 'from-slate-300 to-slate-600' },
                            { label: 'Completed', value: statusWeek.completed, href: '/admin/orders?status=completed', bar: 'from-emerald-200 to-emerald-500' },
                        ].map((s) => (
                            <Link key={s.label} href={s.href} className="block">
                                <p className="text-muted-foreground text-xs">{s.label}</p>
                                <p className="font-semibold">
                                    <Tally to={s.value} />
                                </p>
                                <div className="bg-muted mt-2 h-12 overflow-hidden rounded-lg">
                                    <div
                                        className={cn('h-full rounded-lg bg-gradient-to-r transition-[width] duration-1000 ease-[cubic-bezier(.3,1.4,.5,1)]', s.bar)}
                                        style={{ width: `${Math.max(8, (s.value / statusMax) * 100)}%` }}
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                </Card>

                <Card>
                    <CardTitle action={<ViewAll href="/admin/items?stock=low" />}>Needs Restock</CardTitle>
                    <ul className="divide-border divide-y">
                        {lowStock.length === 0 && <li className="text-muted-foreground py-6 text-center text-sm">Everything is above {threshold} pcs.</li>}
                        {lowStock.map((item) => (
                            <li key={item.id}>
                                <Link href={`/admin/items/${item.id}/edit`} className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5">
                                    <span className="bg-muted grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt="" loading="lazy" className="size-full bg-white object-contain" />
                                        ) : (
                                            <Package className="text-muted-foreground size-5" />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">{item.name}</span>
                                        <span className="text-muted-foreground block truncate text-xs">
                                            {item.sku} · {item.brand}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-right">
                                        <span className={cn('block text-sm font-semibold', item.stock < 0 && 'text-destructive')}>
                                            {fmt(item.stock)} <span className="text-muted-foreground text-xs font-normal">PCS</span>
                                        </span>
                                        <Badge size="sm" variant="destructive">
                                            {item.stock < 0 ? 'Negative' : item.stock === 0 ? 'Out of stock' : 'Low stock'}
                                        </Badge>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            <Card className="flex min-w-0 flex-col xl:col-span-7">
                <CardTitle
                    action={
                        <StretchTabs
                            className="whitespace-nowrap"
                            label="Chart series"
                            options={['Orders', 'Pesos']}
                            value={series}
                            onChange={(v) => setSeries(v as typeof series)}
                        />
                    }
                >
                    Monthly Orders
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                    {key === 'count' ? 'Order requests' : 'Order value'}, last 6 months:{' '}
                    <NumberTicker
                        value={monthly.reduce((a, m) => a + m[key], 0)}
                        variant="white"
                        direction={key === 'count' ? 'up' : 'down'}
                        format={key === 'value' ? (n) => pesoWhole(n) : undefined}
                        className="text-sm"
                    />
                </p>
                <div className="mt-4 flex min-h-64 flex-1 items-end gap-2 sm:gap-4">
                    {monthly.map((m, i) => {
                        const current = i === monthly.length - 1;
                        return (
                            <div key={m.label} className="flex h-full flex-1 flex-col justify-end">
                                <div
                                    className={cn(
                                        'flex min-h-16 flex-col items-center rounded-2xl pt-3 text-xs font-medium transition-[height] duration-700 ease-[cubic-bezier(.3,1.5,.5,1)]',
                                        current ? 'bg-gradient-to-b from-[#d7141a] to-[#8f0b10] text-white shadow-lg shadow-red-600/30' : 'bg-muted text-foreground',
                                    )}
                                    style={{ height: `${Math.max(14, (m[key] / monthMax) * 100)}%` }}
                                >
                                    <span className="flex items-center gap-0.5">
                                        {m.label} <ArrowUpRight className="size-3" />
                                    </span>
                                    <span className={cn('mt-1 text-[11px]', current ? 'text-red-100' : 'text-muted-foreground')}>
                                        {key === 'count' ? fmt(m.count) : `₱${short(m.value)}`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Recent orders */}
            <div className="min-w-0 xl:col-span-12">
                <Card>
                    <CardTitle action={<ViewAll href="/admin/orders" />}>
                        Recent Orders
                        {pending > 0 && <span className="text-muted-foreground ml-2 text-sm font-medium">{pending} to confirm</span>}
                    </CardTitle>
                    <ResponsiveTable
                        selectable={false}
                        rows={recent}
                        empty="No orders yet. They show up here the moment a customer sends one."
                        columns={[
                            {
                                key: 'reference',
                                header: 'Order',
                                cell: (o) => (
                                    <Link href={`/admin/orders/${o.id}`} className={cn('hover:text-primary font-medium', !o.is_read && 'text-primary')}>
                                        {o.reference}
                                    </Link>
                                ),
                            },
                            {
                                key: 'customer_name',
                                header: 'Customer',
                                cell: (o) => (
                                    <span>
                                        {o.customer_name} <span className="text-muted-foreground">{o.phone}</span>
                                    </span>
                                ),
                            },
                            { key: 'created_at', header: 'Date', sortable: true, cell: (o) => when(o.created_at) },
                            {
                                key: 'status',
                                header: 'Status',
                                cell: (o) => (
                                    <Badge variant={STATUS_VARIANT[o.status]} dot pulse={o.status === 'pending'}>
                                        {STATUS_LABEL[o.status]}
                                    </Badge>
                                ),
                            },
                            {
                                key: 'subtotal',
                                header: 'Subtotal',
                                align: 'right',
                                sortable: true,
                                cell: (o) => <span className="font-semibold tabular-nums">{peso(o.subtotal)}</span>,
                            },
                        ]}
                    />
                    {confirmed > 0 && (
                        <p className="text-muted-foreground mt-3 text-sm">
                            {confirmed} confirmed {confirmed === 1 ? 'order' : 'orders'} waiting to be completed.
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
}
