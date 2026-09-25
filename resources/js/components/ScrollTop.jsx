import React, { useEffect, useState } from 'react';

const R = 22;
const C = 2 * Math.PI * R;

/**
 * Back-to-top, stacked above the floating call button. A red ring around it
 * fills as you read down the page, so it doubles as a "how far am I" meter.
 * `lift` raises it above anything docked at the bottom-right.
 */
export default function ScrollTop({ lift = 76 }) {
    const [progress, setProgress] = useState(0);
    const show = progress > 0.08;

    useEffect(() => {
        let frame = 0;
        const measure = () => {
            frame = 0;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(measure);
        };
        measure();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    const toTop = () => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    };

    return (
        <button
            type="button"
            onClick={toTop}
            aria-label={`Back to top (${Math.round(progress * 100)}% down the page)`}
            tabIndex={show ? 0 : -1}
            style={{ bottom: `${lift}px` }}
            className={`lct-top group fixed right-3 z-40 grid size-12 place-items-center rounded-full bg-foam-800 text-white shadow-[0_6px_14px_rgb(0_0_0/0.35)] transition-[opacity,translate,background-color] duration-300 ease-out-expo hover:bg-foam-600 ${
                show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
            }`}
        >
            {/* progress ring: track + red arc, starting at 12 o'clock */}
            <svg viewBox="0 0 48 48" className="pointer-events-none absolute inset-0 size-full -rotate-90" aria-hidden="true">
                <circle cx="24" cy="24" r={R} fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth="2.5" />
                <circle
                    cx="24"
                    cy="24"
                    r={R}
                    fill="none"
                    stroke="#d7141a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - progress)}
                />
            </svg>
            <i className="bx bx-up-arrow-alt relative text-[26px]" aria-hidden="true" />
            <span
                role="tooltip"
                className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-[5px] bg-foam-900 px-2.5 py-1.5 text-[13px] font-medium text-white opacity-0 shadow-[0_4px_12px_rgb(0_0_0/0.35)] transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            >
                Back to top
            </span>
        </button>
    );
}
