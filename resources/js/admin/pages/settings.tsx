import { Badge } from '@/components/glint/badge';
import { Button } from '@/components/glint/button';
import { Input } from '@/components/glint/input';
import AppearanceToggleTab from '@/admin/components/appearance-tabs';
import { Card, CardTitle, Hint, Label, Textarea } from '@/admin/components/kit';
import { Icon } from '@/icons';
import { router, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';

interface Mail {
    mailer: string;
    host: string;
    username: string | null;
    from: string;
    recipient: string | null;
    pending: number;
    stuck: boolean;
    failed: number;
    lastError: string | null;
}

const FIELDS: { key: string; label: string; type: string; hint?: string; wide?: boolean }[] = [
    { key: 'email', label: 'Order notification email', type: 'email', hint: 'Every new order is emailed here.', wide: true },
    { key: 'phone', label: 'Store phone', type: 'text', hint: 'Customers see this and can tap to call.' },
    { key: 'viber', label: 'Viber / mobile (optional)', type: 'text' },
    { key: 'address', label: 'Store address', type: 'text', hint: 'Shown for store pickup.', wide: true },
    { key: 'hours', label: 'Store hours', type: 'text', hint: 'e.g. Mon–Sat, 8 AM – 5 PM' },
    { key: 'facebook_url', label: 'Facebook page link', type: 'url' },
    { key: 'low_stock_threshold', label: 'Low-stock alert at', type: 'number', hint: 'Items at or below this count are flagged in the admin.' },
];

const TABS: { key: string; label: string; hint?: string }[] = [
    { key: 'policy_warranty', label: 'Warranty & service' },
    { key: 'policy_shipping', label: 'Shipping & delivery', hint: 'Leave blank to show the default: couriers offered at checkout, fee confirmed by phone, store pickup.' },
    { key: 'policy_returns', label: 'Returns' },
    { key: 'policy_price_match', label: 'Price match', hint: 'Only if LCT offers one.' },
    { key: 'policy_repair', label: 'Repair', hint: 'Only if LCT offers repair or can refer to service centers.' },
    { key: 'policy_per_order', label: 'Per order / special orders', hint: 'For items not in stock that can be ordered in.' },
];

const KEYS = [...FIELDS.map((f) => f.key), 'bank_details', 'price_note', 'pickup_note', ...TABS.map((t) => t.key)];

export default function Settings({ settings, mail }: { settings: Record<string, string | null>; mail: Mail }) {
    const { data, setData, put, processing, errors } = useForm(Object.fromEntries(KEYS.map((k) => [k, settings[k] ?? ''])) as Record<string, string>);
    const test = useForm({ to: mail.recipient ?? '' });

    const save: FormEventHandler = (e) => {
        e.preventDefault();
        put('/admin/settings', { preserveScroll: true });
    };

    return (
        <div className="grid max-w-4xl gap-4">
            <Card>
                <CardTitle>Appearance</CardTitle>
                <p className="text-muted-foreground mb-4 text-sm">How the admin looks on this device.</p>
                <AppearanceToggleTab />
            </Card>

            <form onSubmit={save} className="grid gap-4">
                <Card className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <CardTitle>Store details</CardTitle>
                        <p className="text-muted-foreground -mt-2 text-sm">Shown on the shop footer, checkout and order emails.</p>
                    </div>
                    {FIELDS.map((f) => (
                        <div key={f.key} className={f.wide ? 'grid gap-2 sm:col-span-2' : 'grid gap-2'}>
                            <Label htmlFor={f.key}>{f.label}</Label>
                            <Input
                                id={f.key}
                                type={f.type}
                                min={f.type === 'number' ? 0 : undefined}
                                value={data[f.key]}
                                onChange={(e) => setData(f.key, e.target.value)}
                                error={errors[f.key]}
                            />
                            {f.hint && <Hint>{f.hint}</Hint>}
                        </div>
                    ))}
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="bank_details">Bank deposit details</Label>
                        <Textarea
                            id="bank_details"
                            rows={3}
                            placeholder="BDO · LCT Trading · 0000 0000 0000"
                            value={data.bank_details}
                            onChange={(e) => setData('bank_details', e.target.value)}
                            error={errors.bank_details}
                        />
                        <Hint>Shown when a customer picks bank deposit. Leave blank to send them after confirming.</Hint>
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="price_note">Price note</Label>
                        <Input
                            id="price_note"
                            placeholder="Prices are subject to LCT’s confirmation. Bulk discounts may be approved when we contact you."
                            value={data.price_note}
                            onChange={(e) => setData('price_note', e.target.value)}
                            error={errors.price_note}
                        />
                        <Hint>Shown under prices on product pages, the tray and checkout. Leave blank to use the text shown here.</Hint>
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="pickup_note">Pickup note</Label>
                        <Input
                            id="pickup_note"
                            placeholder="e.g. Usually ready in 1–2 days"
                            value={data.pickup_note}
                            onChange={(e) => setData('pickup_note', e.target.value)}
                            error={errors.pickup_note}
                        />
                        <Hint>Shown under the store address on every product page. Leave blank to hide.</Hint>
                    </div>
                </Card>

                <Card className="grid gap-5">
                    <div>
                        <CardTitle>Product page tabs</CardTitle>
                        <p className="text-muted-foreground -mt-2 text-sm">
                            Shown on every product page next to the description. A tab with no text is hidden. Each line becomes a paragraph.
                        </p>
                    </div>
                    {TABS.map((t) => (
                        <div key={t.key} className="grid gap-2">
                            <Label htmlFor={t.key}>{t.label}</Label>
                            <Textarea id={t.key} rows={4} value={data[t.key]} onChange={(e) => setData(t.key, e.target.value)} error={errors[t.key]} />
                            {t.hint && <Hint>{t.hint}</Hint>}
                        </div>
                    ))}
                </Card>

                <div>
                    <Button type="submit" loading={processing} startIcon={<Icon name="save" className="size-4" />}>
                        Save settings
                    </Button>
                </div>
            </form>

            {/* Email check: what the server sends with, and whether mail is going out. */}
            <Card className="space-y-4">
                <CardTitle
                    action={
                        mail.stuck ? (
                            <Badge variant="destructive" dot pulse>
                                Stuck
                            </Badge>
                        ) : mail.failed ? (
                            <Badge variant="warning" dot>
                                {mail.failed} failed
                            </Badge>
                        ) : (
                            <Badge variant="success" dot>
                                Sending
                            </Badge>
                        )
                    }
                >
                    Email
                </CardTitle>
                <dl className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Sending through</dt>
                    <dd>{mail.mailer === 'smtp' ? mail.host : `${mail.mailer} (not sending real email)`}</dd>
                    <dt className="text-muted-foreground">Login</dt>
                    <dd>{mail.username || '—'}</dd>
                    <dt className="text-muted-foreground">From</dt>
                    <dd>{mail.from}</dd>
                    <dt className="text-muted-foreground">Orders go to</dt>
                    <dd>{mail.recipient || 'Nobody yet: fill in the order notification email above'}</dd>
                    <dt className="text-muted-foreground">Waiting to send</dt>
                    <dd>
                        {mail.pending}
                        {mail.stuck && <span className="text-destructive font-semibold"> · stuck for over 3 minutes: the cron job isn't running</span>}
                    </dd>
                    <dt className="text-muted-foreground">Failed</dt>
                    <dd>{mail.failed}</dd>
                </dl>
                {mail.lastError && (
                    <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-3 py-2 text-sm">
                        <strong>Last error:</strong> {mail.lastError}
                    </p>
                )}

                <div className="flex flex-wrap items-end gap-3 border-t pt-4">
                    <form
                        className="flex flex-wrap items-end gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            test.post('/admin/settings/test-email', { preserveScroll: true });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="to">Send a test email to</Label>
                            <Input id="to" type="email" required className="w-72" value={test.data.to} onChange={(e) => test.setData('to', e.target.value)} error={test.errors.to} />
                        </div>
                        <Button type="submit" loading={test.processing}>
                            Send test email
                        </Button>
                    </form>
                    {(mail.pending > 0 || mail.failed > 0) && (
                        <Button variant="outline" onClick={() => router.post('/admin/settings/run-queue', {}, { preserveScroll: true })}>
                            Send waiting emails now
                        </Button>
                    )}
                </div>
                <Hint>The test is sent straight away, so if the mail settings in .env are wrong, the error shows here. Order emails are sent by the cron job every minute.</Hint>
            </Card>
        </div>
    );
}
