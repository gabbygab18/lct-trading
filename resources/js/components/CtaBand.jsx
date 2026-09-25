import React from 'react';
import { usePage } from '@inertiajs/react';
import AnimatedHeading from '@/components/AnimatedHeading';
import Reveal from '@/components/Reveal';
import Button from '@/components/ui/Button';
import { BrowseIcon, CartIcon } from '@/components/BxIcons';

/**
 * Last word before the footer: a photo-backed card. Each page gets its own
 * pitch, photo and tint (`variant`), so the close never repeats.
 */
function presets({ routes, tel, phone }) {
    const call = tel
        ? { label: `Call ${phone}`, href: `tel:${tel}`, icon: 'bxs-phone' }
        : { label: 'Send us your list', href: routes.contact, icon: 'bxs-message-dots' };

    return {
        home: {
            photo: 'store',
            tone: 'red',
            eyebrow: 'Ready when you are',
            title: 'Got a list of tools and parts? Send it today.',
            lede: 'Find it by SKU, add it to your tray and send the order. LCT calls to confirm stock, the total and delivery. No account, nothing charged online.',
            primary: { label: 'Shop now', href: routes.catalog, icon: <CartIcon /> },
            secondary: call,
        },
        order: {
            photo: 'boxes',
            tone: 'dark',
            eyebrow: 'Three steps, no account',
            title: 'Your first order takes about two minutes.',
            lede: 'Search, set the quantities, send the tray. We call with the total and the delivery fee before anything is paid.',
            primary: { label: 'Start an order', href: routes.catalog, icon: <CartIcon /> },
            secondary: { label: 'Ask us first', href: routes.contact, icon: 'bxs-message-dots' },
        },
        contact: {
            photo: 'shelf',
            tone: 'split',
            eyebrow: 'Prefer to look first?',
            title: 'See the price and stock before you call.',
            lede: 'Every item shows its price and what’s on hand. Put what you need in your tray and send it; we’ll call you to confirm.',
            primary: { label: 'Browse the shop', href: routes.catalog, icon: <BrowseIcon /> },
            secondary: { label: 'How ordering works', href: routes.howTo, icon: 'bx-list-check' },
        },
    };
}

export default function CtaBand({ variant = 'home' }) {
    const { routes, settings = {} } = usePage().props;
    const tel = (settings.phone || '').replace(/[^0-9+]/g, '');
    const all = presets({ routes, tel, phone: settings.phone });
    const c = all[variant] ?? all.home;

    return (
        <section className="lct-cta" aria-labelledby="lct-cta-title">
            <Reveal className={`lct-cta-card lct-cta--${c.photo} lct-cta--${c.tone}`}>
                <p className="lct-cta-eyebrow">{c.eyebrow}</p>
                <AnimatedHeading as="h2" id="lct-cta-title" text={c.title} />
                <p className="lct-cta-lede">{c.lede}</p>
                <div className="lct-cta-actions">
                    <Button href={c.primary.href} variant="onBrand" size="lg" icon={c.primary.icon} layered>
                        {c.primary.label}
                    </Button>
                    <Button href={c.secondary.href} variant="onBrandGhost" size="lg" icon={c.secondary.icon} layered>
                        {c.secondary.label}
                    </Button>
                </div>
            </Reveal>
        </section>
    );
}
