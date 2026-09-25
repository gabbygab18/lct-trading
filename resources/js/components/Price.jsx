import { money } from '@/lib/format';

const pct = (n) => `${Number(n).toFixed(2).replace(/\.?0+$/, '')}%`;

/**
 * The one way a price is shown. With a discount: the price the customer
 * pays, the listed price struck through, and a "−10%" tag.
 * size: 'lg' (product page), 'md' (cards), 'sm' (rows, search, tray).
 */
export default function Price({ price, listPrice, discount, size = 'md', tone = 'ink', stack = false, className = '' }) {
    const on = listPrice && discount > 0;
    const big = { lg: 'text-[40px]', md: 'text-[22px]', sm: 'text-[15px]' }[size];
    const small = { lg: 'text-[18px]', md: 'text-[13px]', sm: 'text-[12px]' }[size];
    const tag = { lg: 'text-[14px] px-2 py-1', md: 'text-[11.5px] px-1.5 py-0.5', sm: 'text-[11px] px-1 py-px' }[size];
    const main = tone === 'light' ? 'text-steel-50' : tone === 'signal' ? 'text-signal' : 'text-ink';
    const muted = tone === 'light' ? 'text-steel-500' : 'text-steel-700';

    return (
        <span className={`inline-flex ${stack ? 'flex-col items-end' : 'flex-wrap items-baseline'} gap-x-2 gap-y-0.5 ${className}`}>
            <span className={`stamp leading-none ${big} ${on ? 'text-signal' : main}`}>{money(price)}</span>
            {on && (
                <span className="inline-flex items-center gap-1.5">
                    <s className={`${small} leading-none ${muted}`} aria-label={`was ${money(listPrice)}`}>
                        {money(listPrice)}
                    </s>
                    <span className={`stamp rounded-[3px] bg-signal leading-none text-white ${tag}`}>−{pct(discount)}</span>
                </span>
            )}
        </span>
    );
}
