import { Badge } from '@/components/glint/badge';
import { Input } from '@/components/glint/input';
import { StretchTabs } from '@/components/glint/stretch-tabs';
import { PageFooter } from '@/admin/components/kit';
import { ResponsiveTable } from '@/admin/components/responsive-table';
import { fmt, peso, STATUS_LABEL, STATUS_VARIANT, whenTime } from '@/admin/lib/format';
import type { OrderRow, OrderStatus, Paginated } from '@/admin/lib/types';
import { Search } from '@/icons';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const TABS: Record<string, OrderStatus | ''> = { All: '', Pending: 'pending', Confirmed: 'confirmed', Completed: 'completed', Cancelled: 'cancelled' };

export default function Orders({ orders, status, q }: { orders: Paginated<OrderRow>; status: OrderStatus | null; q: string }) {
    const [text, setText] = useState(q);
    useEffect(() => setText(q), [q]);

    const go = (params: { status?: string; q?: string }) => {
        const next = Object.fromEntries(Object.entries({ status: status ?? '', q, ...params }).filter(([, v]) => v));
        router.get('/admin/orders', next, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <div className="bg-card space-y-4 rounded-3xl p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
                <form
                    className="min-w-56 flex-1"
                    onSubmit={(e) => {
                        e.preventDefault();
                        go({ q: text });
                    }}
                >
                    <Input
                        type="search"
                        aria-label="Search orders"
                        placeholder="Order no., name or phone, then Enter"
                        startIcon={<Search className="size-4" />}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </form>
                <div className="-mx-1 max-w-full overflow-x-auto px-1 py-1">
                    <StretchTabs
                        className="whitespace-nowrap"
                        label="Order status"
                        options={Object.keys(TABS)}
                        value={Object.keys(TABS).find((k) => TABS[k] === (status ?? ''))}
                        onChange={(v) => go({ status: TABS[v] })}
                    />
                </div>
            </div>
            <p className="text-muted-foreground text-sm">Newest first. Call the customer, then confirm: confirming takes the items out of stock.</p>

            <ResponsiveTable
                selectable={false}
                rows={orders.data}
                empty={status ? `No orders marked ${status}.` : 'No orders yet.'}
                columns={[
                    {
                        key: 'reference',
                        header: 'Order',
                        cell: (o) => (
                            <Link prefetch href={`/admin/orders/${o.id}`} className="group block">
                                <span className={cn('group-hover:text-primary block font-medium', !o.is_read && 'text-primary')}>{o.reference}</span>
                                <span className="text-muted-foreground text-xs">{whenTime(o.created_at)}</span>
                            </Link>
                        ),
                    },
                    {
                        key: 'customer_name',
                        header: 'Customer',
                        sortable: true,
                        cell: (o) => (
                            <span className="block">
                                <span className="block uppercase">{o.customer_name}</span>
                                <span className="text-muted-foreground text-xs">{o.phone}</span>
                            </span>
                        ),
                    },
                    {
                        key: 'fulfilment',
                        header: 'Fulfilment',
                        cell: (o) => (
                            <span className="block">
                                {o.fulfilment}
                                {o.shipping && <span className="text-muted-foreground block text-xs">{o.shipping}</span>}
                            </span>
                        ),
                    },
                    { key: 'payment', header: 'Payment' },
                    {
                        key: 'item_count',
                        header: 'Qty',
                        align: 'right',
                        sortable: true,
                        cell: (o) => (
                            <span className="font-semibold tabular-nums">
                                {fmt(o.item_count)} <span className="text-muted-foreground text-xs font-normal">PCS</span>
                            </span>
                        ),
                    },
                    {
                        key: 'subtotal',
                        header: 'Subtotal',
                        align: 'right',
                        sortable: true,
                        cell: (o) => <span className="font-semibold tabular-nums">{peso(o.subtotal)}</span>,
                    },
                    {
                        key: 'status',
                        header: 'Status',
                        cell: (o) => (
                            <Badge variant={STATUS_VARIANT[o.status]} dot pulse={o.status === 'pending'}>
                                {STATUS_LABEL[o.status]}
                            </Badge>
                        ),
                    },
                ]}
            />

            <PageFooter page={orders} noun="orders" />
        </div>
    );
}
