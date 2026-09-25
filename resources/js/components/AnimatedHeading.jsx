import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { cn } from '@/lib/utils';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * The one heading component for the public site.
 *
 * Every <h1>/<h2>/<h3> on the front end goes through here so the entrance is
 * identical everywhere: SplitText cuts the heading into words, `mask` wraps
 * each word in its own overflow-hidden sleeve, and the words rise out of that
 * sleeve on a stagger when the heading scrolls into view.
 *
 * Props
 *   as        — tag to render (default h2)
 *   text      — plain string; "\n" starts a new line
 *   children  — use instead of `text` when the heading contains markup
 *   split     — 'words' (default) | 'chars' | 'none'
 *   immediate — animate on mount instead of on scroll. Use inside containers
 *               that are already moving (sticky/parallax cards), where a
 *               ScrollTrigger measured against the sticky element misfires.
 *   delay / stagger / duration / start / once — the usual knobs.
 *
 * Notes
 *   - `autoSplit` re-splits after webfonts land and on resize, so words never
 *     end up mid-line-break. The tween is returned from `onSplit` so GSAP can
 *     rebuild it after each re-split.
 *   - SplitText's default `aria: 'auto'` puts an aria-label on the heading and
 *     hides the word spans, so screen readers still read one clean sentence.
 *     That replaces the old sr-only span.
 *   - prefers-reduced-motion: we skip the split entirely and leave the plain
 *     heading in the DOM.
 */
export default function AnimatedHeading({
    as: Tag = 'h2',
    text,
    children,
    className,
    delay = 0,
    stagger = 0.045,
    duration = 0.55,
    split = 'words',
    immediate = false,
    once = true,
    start = 'top 88%',
    style,
    ...rest
}) {
    const ref = useRef(null);

    useGSAP(
        () => {
            const el = ref.current;
            if (!el) return;

            if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

            const scrollTrigger = immediate ? undefined : { trigger: el, start, once };

            // Headings that carry their own animated markup are moved as a
            // single block — splitting them would rewrite DOM that another
            // component owns.
            if (split === 'none') {
                gsap.from(el, {
                    y: 28,
                    opacity: 0,
                    duration: duration + 0.15,
                    delay,
                    ease: 'power3.out',
                    scrollTrigger,
                });
                return;
            }

            const unit = split === 'chars' ? 'chars' : 'words';

            const instance = SplitText.create(el, {
                type: split === 'chars' ? 'words,chars' : 'words',
                // Named so the clipping masks become .sx-word-mask / .sx-char-mask,
                // which app.css pads so descenders (p, g, y) aren't cut off.
                wordsClass: 'sx-word',
                charsClass: 'sx-char',
                mask: unit,
                autoSplit: true,
                onSplit(self) {
                    return gsap.from(self[unit], {
                        yPercent: 110,
                        opacity: 0,
                        duration,
                        delay,
                        ease: 'power3.out',
                        stagger: split === 'chars' ? stagger * 0.5 : stagger,
                        scrollTrigger,
                    });
                },
            });

            return () => instance.revert();
        },
        { scope: ref, dependencies: [text, split, immediate] }
    );

    const content =
        text !== undefined && text !== null
            ? String(text)
                  .split('\n')
                  .map((line, i) => (
                      <span key={i} className="block">
                          {line}
                      </span>
                  ))
            : children;

    return (
        <Tag ref={ref} className={cn(className)} style={style} {...rest}>
            {content}
        </Tag>
    );
}
