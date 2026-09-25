import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';

// ScrollX UI — @scrollxui/transition (MIT). Converted to JSX. The default
// curtain class points at the site's house green rather than neutral-900.

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const Transition = ({
    intro,
    children,
    introDuration = 1.5,
    transitionDuration = 0.9,
    type = 'curved',
    direction = 'bottom',
    className = 'sx-intro-curtain',
    skip = false,
    autoExit = true,
    trigger,
    onFinished,
}) => {
    const reduced = typeof window !== 'undefined' ? prefersReducedMotion() : false;
    const shouldSkip = skip || reduced;

    const [showIntro, setShowIntro] = useState(!shouldSkip);
    const [animating, setAnimating] = useState(false);
    const [progress, setProgress] = useState(0);

    const ref = useRef(null);
    const inView = useInView(ref, { margin: '-100px', once: true });

    const rafRef = useRef(null);
    const timersRef = useRef([]);

    const propsRef = useRef({ transitionDuration, onFinished });
    useEffect(() => {
        propsRef.current = { transitionDuration, onFinished };
    }, [transitionDuration, onFinished]);

    const [triggerExit] = useState(() => () => {
        setAnimating(true);
        let startTime = null;

        const tick = (now) => {
            if (!startTime) startTime = now;
            const elapsed = (now - startTime) / 1000;
            const raw = Math.min(elapsed / propsRef.current.transitionDuration, 1);
            setProgress(easeInOutCubic(raw));

            if (raw < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setAnimating(false);
                setShowIntro(false);
                setProgress(0);
                rafRef.current = null;
                propsRef.current.onFinished?.();
            }
        };

        rafRef.current = requestAnimationFrame(tick);
    });

    const startTransition = triggerExit;

    useEffect(() => {
        if (shouldSkip) {
            onFinished?.();
            return;
        }

        if (inView && autoExit) {
            const t = window.setTimeout(() => startTransition(), introDuration * 1000);
            timersRef.current.push(t);
        }

        const currentTimers = timersRef.current;
        return () => {
            currentTimers.forEach(clearTimeout);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [shouldSkip, inView, introDuration, autoExit, onFinished, startTransition]);

    useEffect(() => {
        if (!autoExit && trigger && showIntro) startTransition();
    }, [trigger, autoExit, showIntro, startTransition]);

    const getCurvedClip = (p) => {
        const radius = Math.max(0, 160 * (1 - p));
        switch (direction) {
            case 'top':
                return `circle(${radius}% at 50% 0%)`;
            case 'bottom':
                return `circle(${radius}% at 50% 100%)`;
            case 'left':
                return `circle(${radius}% at 0% 50%)`;
            case 'right':
            default:
                return `circle(${radius}% at 100% 50%)`;
        }
    };

    const getSlideTransform = (p) => {
        const pct = Math.round(p * 100);
        switch (direction) {
            case 'bottom':
                return `translateY(${pct}%)`;
            case 'top':
                return `translateY(${-pct}%)`;
            case 'left':
                return `translateX(${-pct}%)`;
            case 'right':
            default:
                return `translateX(${pct}%)`;
        }
    };

    return (
        <div ref={ref} className="relative w-full h-full min-h-full">
            <div className="relative z-0 w-full h-full">{children}</div>

            {showIntro && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center" aria-hidden="true">
                    <div
                        className="absolute inset-0"
                        style={
                            type === 'curved'
                                ? {
                                      clipPath: getCurvedClip(progress),
                                      transition: animating ? undefined : 'none',
                                  }
                                : { transform: getSlideTransform(progress) }
                        }
                    >
                        <div className={`absolute inset-0 ${className}`} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            {typeof intro === 'function' ? intro(triggerExit) : intro}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transition;
