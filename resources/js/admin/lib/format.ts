import type { BadgeVariant } from '@/components/glint/badge';
import type { OrderStatus } from './types';

const NUM = new Intl.NumberFormat('en-PH');
const MONEY = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmt = (n: number) => NUM.format(n);
export const peso = (n: number) => `₱${MONEY.format(n)}`;
export const pesoWhole = (n: number) => `₱${NUM.format(Math.round(n))}`;
export const short = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : fmt(n));

/** Manila time, the way the store reads it. */
export const when = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) =>
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', ...opts }).format(new Date(iso));
export const whenTime = (iso: string) => when(iso, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const STATUS_LABEL: Record<OrderStatus, string> = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' };
export const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
    pending: 'warning',
    confirmed: 'secondary',
    completed: 'success',
    cancelled: 'outline',
};

/** Only ever back to our own admin pages: a ?back=javascript:… would run on click. */
export const safeBack = (back: string | null | undefined, fallback: string) =>
    back && back.startsWith(`${window.location.origin}/admin/`) ? back : fallback;
