import React from 'react';
import AnimatedHeading from '@/components/AnimatedHeading';

/**
 * Section heading. The title runs the GSAP word-rise from AnimatedHeading —
 * words lift out of their masks as the heading scrolls into view.
 *
 * `animate={false}` keeps the GSAP entrance but drops the ScrollTrigger, for
 * headings sitting inside something that already animates on scroll.
 */
export default function SectionHead({ eyebrow, title, lede, center = true, animate = true, style }) {
    return (
        <div className={`section-head${center ? ' center' : ''}`} style={style}>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <AnimatedHeading as="h2" text={title} immediate={!animate} />}
            {lede && <p className="lede">{lede}</p>}
        </div>
    );
}
