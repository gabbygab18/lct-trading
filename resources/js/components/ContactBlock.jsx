import React from 'react';
import { usePage } from '@inertiajs/react';
import AnimatedHeading from '@/components/AnimatedHeading';
import Reveal from '@/components/Reveal';
import Button from '@/components/ui/Button';
import ContactForm from '@/components/ContactForm';
import { CartIcon } from '@/components/BxIcons';

function Row({ icon, label, children }) {
    return (
        <div className="contact-row">
            <i className={`bx ${icon}`} aria-hidden="true" />
            <div>
                <strong>{label}</strong>
                <span>{children}</span>
            </div>
        </div>
    );
}

/** elnovian's contact section, with LCT's details from Admin → Settings. */
export default function ContactBlock() {
    const { settings = {}, store = {}, routes } = usePage().props;
    const tel = (settings.phone || '').replace(/[^0-9+]/g, '');

    return (
        <section className="contact" id="contact">
            <div className="wrap contact-grid">
                <Reveal>
                    <AnimatedHeading as="h2" text="Questions about an item or a bulk order?" />
                    <p className="lede">
                        Tell us the SKU or send a photo of what you need. We’ll check stock and give you the total, delivery included.
                    </p>

                    <div className="contact-list">
                        {settings.phone && <Row icon="bxs-phone" label="Phone">{settings.phone}</Row>}
                        {settings.email && <Row icon="bxs-envelope" label="Email">{settings.email}</Row>}
                        {settings.address && <Row icon="bxs-map" label="Store & pickup">{settings.address}</Row>}
                        {store.hours && <Row icon="bxs-time" label="Hours">{store.hours}</Row>}
                        <Row icon="bxs-truck" label="Delivery or pickup">Courier, Lalamove, cargo or LCT’s own delivery. The fee is confirmed with your order.</Row>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button href={routes.catalog} variant="primary" icon={<CartIcon />} layered>
                            Start an order
                        </Button>
                        {tel && (
                            <Button href={`tel:${tel}`} variant="secondary" icon="bxs-phone" layered>
                                Call
                            </Button>
                        )}
                    </div>
                </Reveal>

                <Reveal from="right">
                    <ContactForm />
                </Reveal>
            </div>
        </section>
    );
}
