import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

/**
 * Scroll-entrance wrapper.
 *
 * Default mode (no `from`, no `index`) is the original behaviour ported from
 * public/js/main.js — toggle `.is-visible` on `.reveal` and let style.css run
 * the transition. Every existing usage keeps working untouched.
 *
 * Passing `from` or `index` opts into the motion-driven entrance carried over
 * from the Isla build: directional slide-in for alternating media/text rows,
 * and an index-based delay so grids cascade instead of landing at once.
 * Easing and offsets are Isla's values.
 */

const EASE = [0.22, 1, 0.36, 1];
const OFFSET = 40;

const offsetFor = (from) => {
    switch (from) {
        case 'left':
            return { x: -OFFSET, y: 0 };
        case 'right':
            return { x: OFFSET, y: 0 };
        case 'down':
            return { x: 0, y: -28 };
        case 'up':
        default:
            return { x: 0, y: 28 };
    }
};

function CssReveal({ as: Tag = 'div', className = '', visible = false, children, ...props }) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(visible);

    useEffect(() => {
        if (visible || !ref.current) return;

        if (!('IntersectionObserver' in window)) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [visible]);

    return (
        <Tag ref={ref} className={`reveal ${isVisible ? 'is-visible' : ''} ${className}`.trim()} {...props}>
            {children}
        </Tag>
    );
}

export default function Reveal({
    as: Tag = 'div',
    className = '',
    visible = false,
    from,
    index = 0,
    duration = 0.6,
    children,
    ...props
}) {
    const useMotion = Boolean(from) || index > 0;

    if (!useMotion) {
        return (
            <CssReveal as={Tag} className={className} visible={visible} {...props}>
                {children}
            </CssReveal>
        );
    }

    const MotionTag = motion[Tag] ?? motion.div;
    const { x, y } = offsetFor(from);

    return (
        <MotionTag
            className={className}
            initial={{ opacity: 0, x, y }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: '-8% 0px' }}
            transition={{ duration, delay: index * 0.08, ease: EASE }}
            {...props}
        >
            {children}
        </MotionTag>
    );
}
