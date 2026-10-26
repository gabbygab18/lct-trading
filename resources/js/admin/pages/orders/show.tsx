import { Badge } from '@/components/glint/badge';
import { Button } from '@/components/glint/button';
import { Card, CardTitle, ConfirmButton } from '@/admin/components/kit';
import { ResponsiveTable } from '@/admin/components/responsive-table';
import { fmt, peso, STATUS_LABEL, STATUS_VARIANT, whenTime } from '@/admin/lib/format';
import type { OrderStatus } from '@/admin/lib/types';
import { Icon } from '@/icons';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';

interface Line {
    id: number;
    sku: string;
    name: string;
    quantity: number;
    price: number;
    list_price: number | null;
    line_total: number;
    product_id: number | null;
    on_hand: number | null;
}

interface Order {
    id: number;
    reference: string;
    status: OrderStatus;
    created_at: string;
    item_count: number;
    subtotal: number;
    customer_name: string;
    phone: string;
    email: string | null;
    fulfilment: 'ship' | 'pickup';
    address: string | null;
    shipping: string | null;
    payment: string;
    notes: string | null;
    stock_deducted_at: string | null;
}

/** What each status can move to: the first is the main action. */
const NEXT: Record<OrderStatus, { to: OrderStatus; label: string; hint?: string }[]> = {
    pending: [
        { to: 'confirmed', label: 'Confirm order', hint: 'Takes the items out of stock.' },
        { to: 'cancelled', label: 'Cancel' },
    ],
    confirmed: [
        { to: 'completed', label: 'Mark completed', hint: 'Delivered or picked up and paid.' },
        { to: 'cancelled', label: 'Cancel', hint: 'Puts the items back in stock.' },
    ],
    completed: [],
    cancelled: [{ to: 'pending', label: 'Reopen' }],
};

export default function OrderShow({ order, lines }: { order: Order; lines: Line[] }) {
    const tel = order.phone.replace(/[^0-9+]/g, '');
    const move = (status: OrderStatus) => router.patch(`/admin/orders/${order.id}/status`, { status }, { preserveScroll: true });
    const back = encodeURIComponent(window.location.href);

    return (
        <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
            <Card>
                <CardTitle
                    action={
                        <Badge variant={STATUS_VARIANT[order.status]} dot pulse={order.status === 'pending'}>
                            {STATUS_LABEL[order.status]}
                        </Badge>
                    }
                >
                    {fmt(order.item_count)} pcs · {whenTime(order.created_at)}
                </CardTitle>
                <ResponsiveTable
                    selectable={false}
                    rows={lines}
                    columns={[
                        {
                            key: 'name',
                            header: 'Item',
                            cell: (l) => (
                                <span className="block">
                                    <span className="block font-medium">{l.name}</span>
                                    {l.product_id ? (
                                        <Link href={`/admin/items/${l.product_id}/edit?back=${back}`} className="text-muted-foreground hover:text-primary text-xs underline">
                                            {l.sku}
                                        </Link>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">{l.sku}</span>
                                    )}
                                </span>
                            ),
                        },
                        { key: 'quantity', header: 'Qty', align: 'right', cell: (l) => <span className="font-semibold tabular-nums">{fmt(l.quantity)}</span> },
                        {
                            key: 'on_hand',
                            header: 'On hand',
                            align: 'right',
                            cell: (l) => (
                                <span
                                    className={cn(
                                        'tabular-nums',
                                        l.on_hand !== null && !order.stock_deducted_at && l.on_hand < l.quantity ? 'text-destructive font-semibold' : 'text-muted-foreground',
                                    )}
                                >
                                    {l.on_hand === null ? 'deleted' : fmt(l.on_hand)}
                                </span>
                            ),
                        },
                        {
                            key: 'price',
                            header: 'Price',
                            align: 'right',
                            cell: (l) => (
                                <span className="whitespace-nowrap tabular-nums">
                                    {l.list_price && <span className="text-muted-foreground mr-1 text-xs line-through">{peso(l.list_price)}</span>}
                                    {peso(l.price)}
                                </span>
                            ),
                        },
                        { key: 'line_total', header: 'Total', align: 'right', cell: (l) => <span className="font-semibold tabular-nums">{peso(l.line_total)}</span> },
                    ]}
                />
                <div className="mt-4 flex items-center justify-end gap-4 border-t pt-4">
                    <span className="text-muted-foreground text-sm">Subtotal before delivery</span>
                    <span className="font-display text-2xl font-black tabular-nums">{peso(order.subtotal)}</span>
                </div>
            </Card>

            <aside className="space-y-4">
                <Card className="space-y-4 text-sm">
                    <div>
                        <p className="text-lg font-semibold">{order.customer_name}</p>
                        <a href={`tel:${tel}`} className="font-display text-primary text-xl font-bold">
                            {order.phone}
                        </a>
                        {order.email && (
                            <a href={`mailto:${order.email}`} className="text-muted-foreground block underline">
                                {order.email}
                            </a>
                        )}
                    </div>
                    <div className="border-t pt-3">
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">{order.fulfilment === 'ship' ? 'Deliver to' : 'Fulfilment'}</p>
                        <p className="mt-1">{order.fulfilment === 'ship' ? order.address : 'Pick up at store'}</p>
                        {order.shipping && <p className="text-muted-foreground mt-1">{order.shipping}</p>}
                    </div>
                    <div className="border-t pt-3">
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">Payment</p>
                        <p className="mt-1">{order.payment}</p>
                    </div>
                    {order.notes && (
                        <div className="border-t pt-3">
                            <p className="text-muted-foreground text-xs tracking-wide uppercase">Customer notes</p>
                            <p className="mt-1 whitespace-pre-line">{order.notes}</p>
                        </div>
                    )}
                    {order.stock_deducted_at && <p className="text-muted-foreground border-t pt-3 text-xs">Stock deducted {whenTime(order.stock_deducted_at)}.</p>}
                </Card>

                {NEXT[order.status].length > 0 && (
                    <Card className="space-y-3">
                        {NEXT[order.status].map((n, i) =>
                            n.to === 'cancelled' ? (
                                <div key={n.to}>
                                    <ConfirmButton
                                        className="w-full"
                                        title={`Cancel ${order.reference}?`}
                                        description={order.stock_deducted_at ? 'The items go back in stock.' : 'The customer is not told automatically: call them first.'}
                                        confirm="Cancel order"
                                        onConfirm={() => move('cancelled')}
                                    >
                                        {n.label}
                                    </ConfirmButton>
                                    {n.hint && <p className="text-muted-foreground mt-1 text-center text-xs">{n.hint}</p>}
                                </div>
                            ) : (
                                <div key={n.to}>
                                    <Button className="w-full" variant={i === 0 ? 'default' : 'outline'} onClick={() => move(n.to)}>
                                        {n.label}
                                    </Button>
                                    {n.hint && <p className="text-muted-foreground mt-1 text-center text-xs">{n.hint}</p>}
                                </div>
                            ),
                        )}
                    </Card>
                )}

                <ConfirmButton
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    startIcon={<Icon name="trash" className="size-4" />}
                    title={`Delete ${order.reference} for good?`}
                    description="It disappears from the admin. Stock taken by a confirmed order is put back first."
                    confirm="Delete order"
                    onConfirm={() => router.delete(`/admin/orders/${order.id}`)}
                >
                    Delete this order
                </ConfirmButton>
            </aside>
        </div>
    );
}
