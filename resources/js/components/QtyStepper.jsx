import { useEffect, useState } from 'react';
import { MinusIcon, PlusIcon } from './Icons';

/**
 * Minus / typed number / plus. Typing is for the contractor who needs 40;
 * the buttons are for everyone else. `tone` picks plate (light) or foam (dark).
 */
export default function QtyStepper({ value, onChange, max = 999, label, tone = 'plate', size = 'md' }) {
    const [draft, setDraft] = useState(String(value));
    useEffect(() => setDraft(String(value)), [value]);

    const commit = (raw) => {
        const n = Math.max(0, Math.min(max, parseInt(raw, 10) || 0));
        setDraft(String(n || value));
        if (n !== value && n > 0) onChange(n);
    };

    const h = size === 'sm' ? 'h-8' : 'h-10';
    const shell =
        tone === 'plate'
            ? 'bg-steel-50/70 ring-1 ring-inset ring-steel-400/80 text-ink'
            : 'bg-foam-900 ring-1 ring-inset ring-foam-500 text-steel-100';
    const btn =
        tone === 'plate'
            ? 'hover:bg-steel-300/70 active:bg-steel-400/70'
            : 'hover:bg-foam-600 active:bg-foam-500';

    return (
        <div className={`inline-flex items-stretch ${h} rounded-[3px] ${shell}`} role="group" aria-label={label}>
            <button
                type="button"
                className={`grid w-9 place-items-center rounded-l-[3px] transition-colors ${btn}`}
                onClick={() => onChange(value - 1)}
                aria-label={value <= 1 ? `Remove ${label}` : `One less ${label}`}
            >
                <MinusIcon className="size-4" />
            </button>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="stamp w-11 min-w-0 bg-transparent text-center text-base outline-none focus-visible:bg-white/40"
                value={draft}
                onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
                onBlur={(e) => commit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                aria-label={`Quantity of ${label}`}
            />
            <button
                type="button"
                className={`grid w-9 place-items-center rounded-r-[3px] transition-colors disabled:opacity-40 ${btn}`}
                onClick={() => onChange(value + 1)}
                disabled={value >= max}
                aria-label={`One more ${label}`}
            >
                <PlusIcon className="size-4" />
            </button>
        </div>
    );
}
