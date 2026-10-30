import React from 'react';
import { usePage } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';
import PageHero from '@/components/PageHero';

export default function Privacy({ updated, sections = [] }) {
    const { settings = {} } = usePage().props;

    return (
        <SiteLayout cta="contact">
            <PageHero
                className="lct-hero-contact"
                crumb="Privacy"
                title="Privacy policy."
                lede={`What we collect when you send an order or a message, and what we do with it. Last updated ${updated}.`}
            />

            <section className="contact lct-privacy">
                <div className="wrap">
                    {/* Same text as the crawler fallback (HomeController::privacySections). */}
                    <div className="lct-prose">
                        {sections.map(([title, paragraphs]) => (
                            <React.Fragment key={title}>
                                <h3>{title}</h3>
                                {paragraphs.map((text) => (
                                    <p key={text}>{text}</p>
                                ))}
                            </React.Fragment>
                        ))}
                        <h3>Contact us</h3>
                        <p>
                            For questions about this policy or your personal details
                            {settings.email && (
                                <>
                                    , email <a href={`mailto:${settings.email}`}>{settings.email}</a>
                                </>
                            )}
                            {settings.phone && <> or call {settings.phone}</>}.
                        </p>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
