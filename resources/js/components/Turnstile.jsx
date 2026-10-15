import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading;
const loadScript = () =>
    (loading ??= new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = SRC;
        s.async = true;
        s.onload = () => resolve(window.turnstile);
        s.onerror = reject;
        document.head.appendChild(s);
    }));

/**
 * Cloudflare Turnstile ("I'm not a robot"). Calls onToken with the token, or
 * '' when it expires. ref.reset() after each submit: a token works once.
 */
const Turnstile = forwardRef(function Turnstile({ siteKey, onToken, theme = 'light' }, ref) {
    const box = useRef(null);
    const id = useRef(null);

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (id.current != null) window.turnstile?.reset(id.current);
            onToken('');
        },
    }));

    useEffect(() => {
        let gone = false;
        loadScript().then((ts) => {
            if (gone || !box.current) return;
            id.current = ts.render(box.current, {
                sitekey: siteKey,
                theme,
                callback: onToken,
                'expired-callback': () => onToken(''),
                'error-callback': () => onToken(''),
            });
        }).catch(() => {});
        return () => {
            gone = true;
            if (id.current != null) window.turnstile?.remove(id.current);
        };
    }, [siteKey]);

    return <div ref={box} className="lct-turnstile" />;
});

export default Turnstile;
