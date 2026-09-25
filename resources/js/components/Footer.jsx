import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FacebookIcon } from '@/components/SiteIcons';

/**
 * elnovian's footer shape: masthead row, then columns, then a quiet legal
 * line. Icons are Boxicons glyphs, so they inherit the link colour.
 */
function Bx({ name, className = '' }) {
    return <i className={`bx ${name} ${className}`} aria-hidden="true" />;
}

export default function Footer() {
    const { settings = {}, navBrands = [], routes, store = {} } = usePage().props;

    return (
        <footer>
            <div className="wrap">
                <div className="footer-masthead">
                    <div className="flex items-center gap-3">
                        <img src="/images/lct-mark.webp" alt="" width="39" height="45" className="h-14 w-auto" />
                        <span className="font-cond text-[28px] font-extrabold leading-none text-white">LCT TRADING</span>
                    </div>
                    {settings.facebook_url && (
                        <div className="social-row" style={{ marginTop: 0 }}>
                            <a href={settings.facebook_url} className="social-btn" aria-label="Facebook" target="_blank" rel="noreferrer">
                                <FacebookIcon />
                            </a>
                        </div>
                    )}
                </div>

                <div className="footer-columns">
                    <div className="footer-col">
                        <h3>Contact</h3>
                        {settings.phone && (
                            <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="footer-contact">
                                <Bx name="bxs-phone" />
                                <span>{settings.phone}</span>
                            </a>
                        )}
                        {settings.email && (
                            <a href={`mailto:${settings.email}`} className="footer-contact">
                                <Bx name="bxs-envelope" />
                                <span>{settings.email}</span>
                            </a>
                        )}
                        {settings.address && (
                            <p className="footer-contact">
                                <Bx name="bxs-map" />
                                <span>{settings.address}</span>
                            </p>
                        )}
                        {store.hours && (
                            <p className="footer-contact">
                                <Bx name="bxs-time" />
                                <span>{store.hours}</span>
                            </p>
                        )}
                    </div>

                    <div className="footer-col footer-brands">
                        <h3>Brands</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
                            {navBrands.map((brand) => (
                                <Link key={brand} href={`${routes.catalog}?brand=${encodeURIComponent(brand)}`}>
                                    {brand}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="footer-col">
                        <h3>Order</h3>
                        <Link href={routes.catalog}>Shop all items</Link>
                        <Link href={routes.howTo}>How to order</Link>
                        <Link href={routes.checkout}>Your tray</Link>
                        <Link href={routes.contact}>Contact us</Link>
                    </div>
                </div>

                <div className="footer-bottom">
                    <span>© {new Date().getFullYear()} LCT Trading. All rights reserved.</span>
                    <span className="tag">Order requests are confirmed by phone. Nothing is charged online.</span>
                </div>
            </div>
        </footer>
    );
}
