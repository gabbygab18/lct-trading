import React from 'react';
import { usePage } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';
import PageHero from '@/components/PageHero';
import ContactBlock from '@/components/ContactBlock';
import Button from '@/components/ui/Button';

export default function Contact() {
    const { settings = {}, routes } = usePage().props;
    const tel = (settings.phone || '').replace(/[^0-9+]/g, '');

    return (
        <SiteLayout
            cta="contact"
            title="Contact · LCT Trading"
            description="Call, email or message LCT Trading about an item, a bulk order or delivery. Send the SKU or a photo and we’ll check stock and give you the total."
        >
            <PageHero
                className="lct-hero-contact"
                crumb="Contact"
                title="Talk to LCT."
                lede="Ask about an item, a bulk order or delivery. Send the SKU or a photo, and we’ll check stock and get back to you with the total."
            >
                <div className="hero-actions">
                    {tel && (
                        <Button href={`tel:${tel}`} variant="primary" icon="bxs-phone" layered>
                            Call {settings.phone}
                        </Button>
                    )}
                    <Button href={routes.howTo} variant="onImage" icon="bx-list-check" layered>
                        How ordering works
                    </Button>
                </div>
            </PageHero>

            <ContactBlock />
        </SiteLayout>
    );
}
