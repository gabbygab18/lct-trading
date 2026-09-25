import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AnimatedHeading from '@/components/AnimatedHeading';

/** Short photo banner that opens the inner pages; each page passes its own photo class. */
export default function PageHero({ crumb, title, lede, className = '', children }) {
    const { routes } = usePage().props;

    return (
        <section className={`hero lct-page-hero ${className}`}>
            <div className="wrap hero-grid">
                <div className="hero-content">
                    <nav aria-label="Breadcrumb" className="lct-crumbs">
                        <Link href={routes.home}>Home</Link>
                        <i className="bx bx-chevron-right" aria-hidden="true" />
                        <span aria-current="page">{crumb}</span>
                    </nav>
                    <AnimatedHeading as="h1" text={title} immediate delay={0.1} />
                    {lede && <p className="lede">{lede}</p>}
                    {children}
                </div>
            </div>
        </section>
    );
}
