import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CtaBand from '@/components/CtaBand';
import Frap from '@/components/Frap';
import ScrollTop from '@/components/ScrollTop';

/**
 * elnovian's page wrapper. `.el-site` scopes the ported stylesheet; it is
 * display: contents so the sticky header still sticks to the page.
 */
export default function SiteLayout({ title, description, cta = 'home', children }) {
    // Inertia visits don't fire the browser's own hash scroll.
    useEffect(() => {
        if (!window.location.hash) return;
        const target = document.querySelector(window.location.hash);
        if (target) window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }, []);

    return (
        <div className="el-site contents">
            <Head>
                {title && <title>{title}</title>}
                {description && <meta name="description" content={description} />}
            </Head>
            <Header />
            {children}
            <CtaBand variant={cta} />
            <Footer />
            <Frap />
            <ScrollTop />
        </div>
    );
}
