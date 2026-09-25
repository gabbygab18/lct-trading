import React from 'react';
import { usePage } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';
import PageHero from '@/components/PageHero';
import SectionHead from '@/components/SectionHead';
import OrderSteps from '@/components/OrderSteps';
import Reveal from '@/components/Reveal';
import Button from '@/components/ui/Button';
import { CartIcon, PayIcon, StoreIcon } from '@/components/BxIcons';

function InfoCard({ Icon, icon, title, children, index }) {
    return (
        <Reveal index={index} className="lct-info-card">
            <span className="lct-info-icon" aria-hidden="true">
                {Icon ? <Icon /> : <i className={`bx ${icon}`} />}
            </span>
            <h3>{title}</h3>
            {children}
        </Reveal>
    );
}

/** One question, opened in place. Native <details>, so it works without JS. */
function Faq({ q, children }) {
    return (
        <details className="lct-faq">
            <summary>
                <span>{q}</span>
                <i className="bx bx-plus" aria-hidden="true" />
            </summary>
            <div className="lct-faq-body">{children}</div>
        </details>
    );
}

export default function HowToOrder({ shipping, payment, pickupNote, policies = [] }) {
    const { routes, store = {} } = usePage().props;

    return (
        <SiteLayout
            cta="order"
            title="How to order · LCT Trading"
            description="Order tools and hardware from LCT Trading in three steps. No account, nothing charged online: LCT confirms stock, total and delivery by phone."
        >
            <PageHero
                className="lct-hero-order"
                crumb="How to order"
                title="Send the order. We confirm before you pay."
                lede="No account and no online payment. Your tray goes to LCT as a request, and we call or text you with the final total and delivery fee."
            >
                <div className="hero-actions">
                    <Button href={routes.catalog} variant="primary" icon={<CartIcon />} layered>
                        Start an order
                    </Button>
                </div>
            </PageHero>

            <section className="rates">
                <div className="wrap">
                    <SectionHead title="Three steps, start to finish." lede="Most orders take a couple of minutes. Contractors with a SKU list can switch the shop to list view and type quantities straight in." />
                    <OrderSteps />
                </div>
            </section>

            <section className="services">
                <div className="wrap">
                    <SectionHead title="Delivery, pickup and payment." lede="You choose these at checkout. Nothing is final until LCT confirms it with you." />
                    <div className="lct-info-grid">
                        <InfoCard icon="bxs-truck" title="Delivery" index={0}>
                            <ul className="lct-info-list">
                                {Object.values(shipping).map((label) => (
                                    <li key={label}>{label}</li>
                                ))}
                            </ul>
                            <p>The fee depends on weight and distance. We confirm it by phone before anything ships.</p>
                        </InfoCard>
                        <InfoCard Icon={StoreIcon} title="Store pickup" index={1}>
                            <p>Free. Pick it up once we tell you it’s ready.</p>
                            {store.address && <p><strong>Where:</strong> {store.address}</p>}
                            {store.hours && <p><strong>Hours:</strong> {store.hours}</p>}
                            {pickupNote && <p>{pickupNote}</p>}
                        </InfoCard>
                        <InfoCard Icon={PayIcon} title="Payment" index={2}>
                            <ul className="lct-info-list">
                                {Object.values(payment).map((label) => (
                                    <li key={label}>{label}</li>
                                ))}
                            </ul>
                            <p>Nothing is charged online. For bank deposit, we send the account details when we confirm your order.</p>
                        </InfoCard>
                    </div>
                    <p className="lct-price-callout">
                        <i className="bx bx-info-circle" aria-hidden="true" />
                        {store.priceNote}
                    </p>
                </div>
            </section>

            <section className="contact lct-faq-section">
                <div className="wrap lct-faq-wrap">
                    <SectionHead title="Common questions." center={false} />
                    <div>
                        <Faq q="Do I need an account?">
                            <p>No. Add items to your tray, then give your name, phone and address at checkout. That’s it.</p>
                        </Faq>
                        <Faq q="Is the price on the site final?">
                            <p>{store.priceNote} The delivery fee is confirmed on the same call.</p>
                        </Faq>
                        <Faq q="Can I order in bulk?">
                            <p>Yes. Use list view in the shop to type quantities row by row. Larger orders may get a bulk discount when we call to confirm.</p>
                        </Faq>
                        <Faq q="What if an item is out of stock?">
                            <p>Stock is shown on every item. Out-of-stock items can’t be sent. If you ask for more than we have on hand, we’ll tell you when we call.</p>
                        </Faq>
                        <Faq q="How do I follow up on my order?">
                            <p>Right after you send it, you get a reference number (it starts with LCT-). Quote it when you call or message us.</p>
                        </Faq>
                        {policies.map((p) => (
                            <Faq key={p.key} q={p.label}>
                                <div className="lct-prose" dangerouslySetInnerHTML={{ __html: p.html }} />
                            </Faq>
                        ))}
                    </div>
                </div>
            </section>

        </SiteLayout>
    );
}
