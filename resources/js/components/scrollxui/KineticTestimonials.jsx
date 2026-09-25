import { cn } from '@/lib/utils';

/**
 * ScrollXUI-style `kinetic-testimonials` — a continuously moving
 * marquee track. Ported from the Isla build; used here for the nearby-
 * amenities strip, which was a static row of pills.
 */
export default function KineticTestimonials({ items = [], className, speed = 'animate-marquee' }) {
    const doubled = [...items, ...items];

    return (
        <div
            aria-hidden="true"
            className={cn('overflow-hidden border-y border-hairline py-4', className)}
        >
            <div className={cn('flex w-max items-center gap-10 whitespace-nowrap pr-10', speed)}>
                {doubled.map((item, i) => (
                    <span key={i} className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />
                        <span className="sx-marquee-item">{item}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
