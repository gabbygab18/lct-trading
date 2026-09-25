import { usePage } from '@inertiajs/react';
import { number } from '@/lib/format';

/**
 * Plain words for stock; the out-of-stock pocket itself does the shouting.
 * `tone` is the ground it sits on, so the warning red stays readable.
 */
export default function StockNote({ stock, className = '', quiet = '', tone = 'plate' }) {
    const low = usePage().props.lowStock ?? 5;
    const alert = tone === 'foam' ? 'text-[#ff7a7e]' : stock <= 0 ? 'text-signal-600' : 'text-signal-700';
    if (stock <= 0) return <span className={`font-semibold ${alert} ${className}`}>Out of stock</span>;
    if (stock <= low) return <span className={`font-semibold ${alert} ${className}`}>Only {number(stock)} left</span>;
    return <span className={`${quiet} ${className}`}>In stock</span>;
}
