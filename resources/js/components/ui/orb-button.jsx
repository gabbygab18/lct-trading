import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Orb button — @scrollxui/orb-button, adapted for this site.
 *
 * An outlined pill with a dot that grows into a circle and reveals an arrow as
 * you approach it. Reworked here for:
 *
 *   • Tailwind 3 (the registry ships v4 utilities: `h-13`, `translate-x-1.25`,
 *     `outline-hidden`)
 *   • this site's greens instead of black/white
 *   • links: the registry renders a <button> only, so `as` was added for
 *     Inertia's <Link> and plain anchors
 *
 * Touch keeps the registry's behaviour — tapping expands the orb briefly, since
 * a touch screen has no hover.
 *
 * Props
 *   tone   light (on the page ground) | onBrand (on the green band)
 *   size   sm | md | lg
 *   icon   Boxicons class shown inside the orb, default bx-right-arrow-alt
 *   as     element or component to render as
 */
const orbVariants = cva(
    'sx-btn group relative inline-flex items-center overflow-hidden whitespace-nowrap rounded-pill border font-semibold ' +
    'transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
    'focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
    {
        variants: {
            tone: {
                light: 'border-ink/25 bg-transparent text-rose hover:border-rose/60 data-[touched=true]:border-rose/60',
                onBrand: 'border-white/40 bg-transparent text-white hover:border-white data-[touched=true]:border-white',
            },
            size: {
                sm: 'h-10 gap-3 px-4 text-[13px] hover:gap-2 hover:pl-1.5 data-[touched=true]:gap-2 data-[touched=true]:pl-1.5',
                md: 'h-12 gap-3 px-5 text-[15px] hover:gap-2 hover:pl-2 data-[touched=true]:gap-2 data-[touched=true]:pl-2',
                lg: 'h-14 gap-3 px-6 text-[15px] hover:gap-2 hover:pl-2 data-[touched=true]:gap-2 data-[touched=true]:pl-2',
            },
        },
        defaultVariants: { tone: 'light', size: 'md' },
    },
);

const ORB_SIZE = {
    sm: 'group-hover:h-7 group-hover:w-7 group-data-[touched=true]:h-7 group-data-[touched=true]:w-7',
    md: 'group-hover:h-9 group-hover:w-9 group-data-[touched=true]:h-9 group-data-[touched=true]:w-9',
    lg: 'group-hover:h-11 group-hover:w-11 group-data-[touched=true]:h-11 group-data-[touched=true]:w-11',
};

const OrbButton = React.forwardRef(function OrbButton(
    { className, tone = 'light', size = 'md', icon = 'bx-right-arrow-alt', children, as: Comp = 'button', ...props },
    ref,
) {
    const timeout = React.useRef(null);
    const buttonRef = React.useRef(null);

    // A touch screen has no hover, so a tap expands the orb for a moment.
    const onTouchStart = () => {
        if (buttonRef.current) buttonRef.current.dataset.touched = 'true';

        window.clearTimeout(timeout.current);
        timeout.current = window.setTimeout(() => {
            if (buttonRef.current) buttonRef.current.dataset.touched = 'false';
        }, 1500);
    };

    React.useEffect(() => () => window.clearTimeout(timeout.current), []);

    return (
        <Comp
            ref={(node) => {
                buttonRef.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            }}
            onTouchStart={onTouchStart}
            className={cn(orbVariants({ tone, size }), className)}
            {...props}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'relative flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full transition-all duration-500',
                    tone === 'onBrand' ? 'bg-white' : 'bg-rose',
                    ORB_SIZE[size],
                )}
            >
                <span
                    className={cn(
                        'flex scale-50 items-center justify-center opacity-0 transition-all duration-300',
                        'group-hover:scale-100 group-hover:opacity-100 group-data-[touched=true]:scale-100 group-data-[touched=true]:opacity-100',
                        tone === 'onBrand' ? 'text-rose' : 'text-white',
                    )}
                >
                    {typeof icon === 'string' ? <i className={cn('bx text-[14px] leading-none', icon)} aria-hidden="true" /> : <span className="inline-flex text-[14px] leading-none">{icon}</span>}
                </span>
            </span>

            <span className="relative z-10 transition-transform duration-500 group-hover:translate-x-1 group-data-[touched=true]:translate-x-1">
                {children}
            </span>
        </Comp>
    );
});

export { OrbButton, orbVariants };
