import React from 'react';
import { usePage } from '@inertiajs/react';

// Floating "call us" action button, carried over from elnovian.
export default function Frap() {
    const { settings = {} } = usePage().props;
    const tel = (settings.phone || '').replace(/[^0-9+]/g, '');
    if (!tel) return null;

    return (
        <a href={`tel:${tel}`} className="frap" aria-label="Call LCT Trading">
            <i className="bx bxs-phone text-[26px]" aria-hidden="true" />
        </a>
    );
}
