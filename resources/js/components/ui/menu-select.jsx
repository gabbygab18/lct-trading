import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * A select built on the same @scrollxui dropdown-menu as the header's Brands
 * menu, so every list on the site opens the same way (elnovian replaced its
 * <select>s the same way in InquiryForm).
 *
 * options: [{ value, label }]
 */
export default function MenuSelect({ label, value, onChange, options, className, id, invalid }) {
    const [open, setOpen] = useState(false);
    const current = options.find((o) => o.value === value) ?? options[0];

    return (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger className="w-full min-w-0 rounded-[4px] hover:shadow-none">
                <button
                    id={id}
                    type="button"
                    aria-label={label}
                    aria-invalid={invalid ? 'true' : undefined}
                    className={cn(
                        'flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[4px] bg-foam-700 pl-3 pr-2.5 text-left text-[14px] text-steel-100 ring-1 ring-inset ring-foam-500 hover:bg-foam-600',
                        open && 'ring-2 ring-signal',
                        className,
                    )}
                >
                    <span className="truncate">{current?.label}</span>
                    <i className={cn('bx bx-chevron-down shrink-0 text-[18px] text-steel-400 transition-transform', open && 'rotate-180')} aria-hidden="true" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} maxHeight="22rem" className="field-menu w-[var(--radix-dropdown-menu-trigger-width)] min-w-[220px]">
                {options.map((o) => (
                    <DropdownMenuItem
                        key={o.value}
                        onSelect={() => {
                            setOpen(false);
                            if (o.value !== value) onChange(o.value);
                        }}
                        aria-checked={o.value === value}
                    >
                        <span className={cn('flex-1', o.value === value && 'font-semibold text-white')}>{o.label}</span>
                        {o.value === value && <i className="bx bx-check text-[18px] text-signal" aria-hidden="true" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
