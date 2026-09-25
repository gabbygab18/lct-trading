import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useInView } from 'motion/react';
import { cn } from '@/lib/utils';

// ScrollX UI — @scrollxui/statscount (MIT). Converted to JSX.
// Changes: `prefix` support added (so "1st" and "24/7" read correctly), the
// blue accent swapped for the site's --green-accent via the `primary` token,
// and the hardcoded gray label/divider colours swapped for --text-black-soft
// and --hairline. Sizes come from the px-scaled Tailwind theme.

function AnimatedCounter({ value, prefix = '', suffix = '', delay = 0, label }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { damping: 20, stiffness: 50, mass: 1 });
    const rounded = useTransform(springValue, (latest) =>
        Number(latest.toFixed(value % 1 === 0 ? 0 : 1))
    );

    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const unsubscribe = rounded.on('change', (latest) => setDisplayValue(latest));
        return () => unsubscribe();
    }, [rounded]);

    useEffect(() => {
        let timeout;
        if (isInView) {
            motionValue.set(0);
            timeout = setTimeout(() => motionValue.set(value), delay * 300);
        } else {
            motionValue.set(0);
        }
        return () => clearTimeout(timeout);
    }, [isInView, value, motionValue, delay]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: delay * 0.2, type: 'spring', stiffness: 80 }}
            className="text-center flex-1 min-w-0 flex flex-col justify-center h-full"
        >
            <motion.div
                className="sx-stats-value text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 whitespace-nowrap"
                initial={{ scale: 0.8 }}
                animate={isInView ? { scale: 1 } : { scale: 0.8 }}
                transition={{ duration: 0.6, delay: delay * 0.2 + 0.3, type: 'spring', stiffness: 100 }}
            >
                {prefix}
                {Number(displayValue).toLocaleString('en-PH')}
                {suffix}
            </motion.div>
            <motion.p
                className="sx-stats-label px-1 sm:px-2 m-0"
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: delay * 0.2 + 0.6, duration: 0.6 }}
            >
                {label}
            </motion.p>
        </motion.div>
    );
}

export default function StatsCount({ stats = [], title, showDividers = true, className = '' }) {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true });

    return (
        <motion.div
            ref={containerRef}
            className={cn('sx-stats w-full overflow-hidden', className)}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
        >
            {title && (
                <motion.div
                    className="text-center mb-6 sm:mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <p className="eyebrow m-0">{title}</p>
                </motion.div>
            )}

            <div className="w-full">
                <div className="flex flex-row items-stretch justify-between gap-3 sm:gap-6 lg:gap-10 w-full">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="relative flex-1 min-w-0 flex flex-col justify-center h-full"
                        >
                            <AnimatedCounter
                                value={stat.value}
                                prefix={stat.prefix}
                                suffix={stat.suffix}
                                delay={index}
                                label={stat.label}
                            />
                            {index < stats.length - 1 && showDividers && (
                                <motion.div
                                    className="absolute -right-1.5 sm:-right-3 lg:-right-5 top-1/2 -translate-y-1/2 h-12 sm:h-16 w-px bg-border"
                                    initial={{ opacity: 0, scaleY: 0 }}
                                    animate={
                                        isInView
                                            ? { opacity: 1, scaleY: 1 }
                                            : { opacity: 0, scaleY: 0 }
                                    }
                                    transition={{ delay: 1.5 + index * 0.2, duration: 0.6 }}
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
