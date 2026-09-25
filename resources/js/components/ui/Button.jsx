import { forwardRef } from 'react';
import { Link } from '@inertiajs/react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LayeredButton } from './layered-button';
import { OrbButton } from './orb-button';

/**
 * The one button in the system.
 *
 * It renders as whichever element the job calls for — a <button> by default, an
 * Inertia <Link> when `href` points inside the site, a plain <a> for tel:,
 * mailto: and external links — so a "button" never has to be faked with a div
 * and never loses keyboard or middle-click behaviour.
 *
 * Variants carry the site's own greens (the hex values declared in
 * public/css/style.css, surfaced as the `rose` and `ink` tokens in
 * tailwind.config.js), so no new colour enters the palette.
 *
 * Props
 *   variant  primary | secondary | onBrand | onBrandGhost | onImage | ghost
 *   size     sm | md | lg
 *   icon     Boxicons class rendered before the label (e.g. 'bx-phone')
 *   trailing Boxicons class rendered after the label
 *   layered  swap in the layered morph — a circle rises and the label flips
 *   orb      swap in the orb morph — a dot opens into an arrow
 *   loading  disables the button and announces busy state
 *   block    full width
 */
const styles = cva(
    'sx-btn inline-flex items-center justify-center gap-2.5 rounded-pill font-semibold transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-60',
    {
        variants: {
            variant: {
                primary: 'bg-rose text-white hover:bg-rose-deep',
                secondary: 'border border-ink/25 text-rose hover:border-rose/50 hover:bg-rose/5',
                onBrand: 'bg-white text-rose hover:bg-white/90',
                onBrandGhost: 'border border-white/40 text-white hover:bg-white/10',
                // Over a photograph: white label and rule with a faint scrim, so
                // it holds up over the bright and dark areas of the picture alike.
                onImage: 'border border-white text-white backdrop-blur-[2px] bg-white/10 hover:bg-white/20',
                ghost: 'text-rose hover:bg-rose/5',
                // Alias kept for the registry components, which ask for shadcn's names.
                outline: 'border border-ink/25 text-rose hover:border-rose/50 hover:bg-rose/5',
            },
            size: {
                sm: 'h-10 px-5 text-[13px]',
                md: 'h-12 px-7 text-[15px]',
                lg: 'h-14 px-9 text-[15px]',
                icon: 'h-10 w-10 p-0 text-[15px]',
            },
            block: { true: 'w-full', false: '' },
        },
        defaultVariants: { variant: 'primary', size: 'md', block: false },
    },
);

/** tel:, mailto:, #anchors and absolute URLs must not go through Inertia. */
function isExternal(href) {
    return typeof href === 'string' && /^(https?:|tel:|mailto:|#)/.test(href);
}

/** Which element carries the label, given where the button points. */
function elementFor(href) {
    if (!href) return 'button';

    return isExternal(href) ? 'a' : Link;
}

function Bx({ name, className }) {
    // a Boxicons class name, or an SVG icon element (components/BxIcons)
    if (typeof name !== 'string') return <span className={cn('inline-flex text-[18px] leading-none', className)}>{name}</span>;
    return <i className={cn('bx text-[18px] leading-none', name, className)} aria-hidden="true" />;
}

const Button = forwardRef(function Button(
    {
        variant, size, block, icon, trailing, loading = false, disabled, className, children,
        href, type = 'button', layered = false, orb = false, ...props
    },
    ref,
) {
    const content = (
        <>
            {icon && <Bx name={icon} />}
            <span>{children}</span>
            {trailing && <Bx name={trailing} />}
        </>
    );

    // `orb` swaps in the @scrollxui orb button — the outlined pill whose dot
    // opens into an arrow. Used for the quieter, secondary actions.
    if (orb && !loading && !disabled) {
        const onDark = variant === 'onBrand' || variant === 'onBrandGhost' || variant === 'onImage';

        return (
            <OrbButton
                ref={ref}
                as={elementFor(href)}
                tone={onDark ? 'onBrand' : 'light'}
                size={size ?? 'md'}
                icon={trailing ?? icon ?? 'bx-right-arrow-alt'}
                className={cn(block && 'w-full justify-center', className)}
                {...(href ? { href } : { type })}
                {...props}
            >
                {children}
            </OrbButton>
        );
    }

    // `layered` swaps in the @scrollxui layered button — same content and the
    // same link/button decision, just the animated hover treatment.
    if (layered && !loading && !disabled) {
        const layeredVariant = {
            primary: 'filled',
            secondary: 'brand',
            ghost: 'brand',
            onBrand: 'onBrand',
            onBrandGhost: 'onBrandOutline',
            onImage: 'onBrandOutline',
        }[variant ?? 'primary'] ?? 'filled';

        return (
            <LayeredButton
                ref={ref}
                as={elementFor(href)}
                variant={layeredVariant}
                size={size ?? 'md'}
                className={cn(block && 'w-full', className)}
                {...(href ? { href } : { type })}
                {...props}
            >
                {content}
            </LayeredButton>
        );
    }

    const classes = cn(styles({ variant, size, block }), className);

    if (href && !disabled && !loading) {
        const Comp = elementFor(href);

        return (
            <Comp ref={ref} href={href} className={classes} {...props}>
                {content}
            </Comp>
        );
    }

    return (
        <button
            ref={ref}
            type={type}
            className={classes}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...props}
        >
            {content}
        </button>
    );
});

export default Button;
