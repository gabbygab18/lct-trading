import React, { useEffect, useRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Layered button — @scrollxui/layered-button, adapted for this site.
 *
 * On hover a filled circle grows from the bottom edge while the label slides up
 * and its inverted twin slides in behind it. Reworked here for:
 *
 *   • Tailwind 3 (the registry ships v4 syntax: `p-0!`, `z-2`, `outline-hidden`)
 *   • this site's greens and pill radius rather than shadcn's neutral tokens
 *   • honour prefers-reduced-motion — the hover animation is skipped and the
 *     button simply changes colour
 *
 * Props
 *   variant  filled (green) | brand (outline) | onBrand | onBrandOutline
 *   size     sm | md | lg
 *   as       element or component to render as — Inertia's <Link> for internal
 *            hrefs, 'a' for tel:/mailto:/external. Radix Slot cannot work here:
 *            the button renders its own circle and a duplicate label alongside
 *            the label passed in, and Slot accepts exactly one child.
 */
const layeredVariants = cva(
    'sx-btn group relative box-border inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-pill ' +
    'font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
    'focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
    {
        variants: {
            // Resting appearance matches the rest of the site's buttons; the
            // layered circle only appears on hover.
            variant: {
                filled: 'border border-rose bg-rose text-white',
                brand: 'border border-ink/25 bg-transparent text-rose',
                onBrand: 'border border-white bg-white text-rose',
                onBrandOutline: 'border border-white/40 bg-transparent text-white',
            },
            size: {
                sm: 'h-10 text-[13px]',
                md: 'h-12 text-[15px]',
                lg: 'h-14 text-[15px]',
            },
        },
        defaultVariants: { variant: 'filled', size: 'md' },
    },
);

const PADDING = { sm: 'px-5', md: 'px-7', lg: 'px-9' };

// What the rising circle is filled with, and the colour the label turns once it
// is covering the button.
const HOVER_FILL = {
    filled: 'bg-white',
    brand: 'bg-rose',
    onBrand: 'bg-rose',
    onBrandOutline: 'bg-white',
};

const HOVER_TEXT = {
    filled: 'text-rose',
    brand: 'text-white',
    onBrand: 'text-white',
    onBrandOutline: 'text-rose',
};

const REDUCED_HOVER = {
    filled: 'motion-reduce:hover:bg-rose-deep',
    brand: 'motion-reduce:hover:bg-rose motion-reduce:hover:text-white',
    onBrand: 'motion-reduce:hover:bg-white/90',
    onBrandOutline: 'motion-reduce:hover:bg-white/10',
};

const LayeredButton = React.forwardRef(function LayeredButton(
    { className, variant = 'filled', size = 'md', children, as: Comp = 'button', ...props },
    ref,
) {
    const buttonRef = useRef(null);

    React.useImperativeHandle(ref, () => buttonRef.current);

    // Only the circle's geometry needs measuring. Everything that moves is
    // driven by CSS :hover/:focus-visible from here, so the button cannot be
    // left in a half-animated state with its label parked outside the box.
    useEffect(() => {
        const button = buttonRef.current;

        if (!button) return undefined;

        const layout = () => {
            const { width: w, height: h } = button.getBoundingClientRect();

            if (!w || !h) return;

            // Big enough that, rising from the bottom edge, the circle covers
            // the whole button — the radius through the two corners.
            const radius = ((w * w) / 4 + h * h) / (2 * h);
            const diameter = Math.ceil(2 * radius) + 2;
            const delta = Math.ceil(radius - Math.sqrt(Math.max(0, radius * radius - (w * w) / 4))) + 1;

            button.style.setProperty('--layer-size', `${diameter}px`);
            button.style.setProperty('--layer-bottom', `-${delta}px`);
            button.style.setProperty('--layer-origin', `${diameter - delta}px`);
            button.style.setProperty('--layer-shift', `${h + 8}px`);
            button.style.setProperty('--layer-enter', `${Math.ceil(h + 12)}px`);
        };

        layout();

        const observer = new ResizeObserver(layout);
        observer.observe(button);

        return () => observer.disconnect();
    }, [size]);

    return (
        <Comp
            ref={buttonRef}
            className={cn(
                layeredVariants({ variant, size }),
                'sx-layered',
                // Without the animation the button still has to react to hover.
                'motion-reduce:transition-colors',
                REDUCED_HOVER[variant],
                className,
            )}
            {...props}
        >
            <span
                aria-hidden="true"
                className={cn('sx-layered-circle motion-reduce:hidden', HOVER_FILL[variant])}
            />

            <span className={cn('relative z-10 inline-flex items-center justify-center gap-2.5', PADDING[size])}>
                <span className="sx-layered-label inline-flex items-center gap-2.5">
                    {children}
                </span>

                {/* The copy that rides in over the filled circle. Hidden from
                    assistive tech: it is the same label twice. */}
                <span
                    aria-hidden="true"
                    className={cn(
                        'sx-layered-twin absolute inset-0 z-10 inline-flex items-center justify-center gap-2.5 whitespace-nowrap motion-reduce:hidden',
                        PADDING[size],
                        HOVER_TEXT[variant],
                    )}
                >
                    {children}
                </span>
            </span>
        </Comp>
    );
});

export { LayeredButton, layeredVariants };
