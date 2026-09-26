import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';
import AnimatedHeading from '@/components/AnimatedHeading';
import Reveal from '@/components/Reveal';
import SectionHead from '@/components/SectionHead';
import ContactBlock from '@/components/ContactBlock';
import OrderSteps from '@/components/OrderSteps';
import SearchSuggest from '@/components/SearchSuggest';
import Transition from '@/components/ui/transition';
import StatsCount from '@/components/ui/statscount';
import { Card, CardContent } from '@/components/ui/card';
import LogoLoop from '@/components/LogoLoop';
import Button from '@/components/ui/Button';
import { number } from '@/lib/format';
import { BrowseIcon, CartIcon, PackageIcon, PayIcon, SkuIcon, StoreIcon } from '@/components/BxIcons';

// Why ordering here is quick. Each line is something the site actually does.
const REASONS = [
    { Icon: SkuIcon, title: 'Search by SKU', copy: 'Type the model code or part of a name. Results update as you type.' },
    { Icon: PackageIcon, title: 'Stock on every item', copy: 'In stock, low or out, shown before you add it.' },
    { Icon: PayIcon, title: 'Nothing charged online', copy: 'Pay by cash on delivery or bank deposit once we confirm.' },
    { Icon: StoreIcon, title: 'Deliver or pick up', copy: 'Courier, Lalamove, cargo, or collect it at the store.' },
];

function HeroSearch() {
    const { routes } = usePage().props;
    const [q, setQ] = useState('');
    const search = (value) => router.get(routes.catalog, value.trim() ? { q: value.trim() } : {});
    return (
        <form role="search" className="lct-hero-search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="hero-search" className="sr-only">Search items by name or SKU</label>
            <SearchSuggest value={q} onChange={setQ} onSearch={search} panelClassName="text-left">
                {(inputProps) => (
                    <div className="flex w-full">
                        <i className="bx bx-search lct-hero-icon" aria-hidden="true" />
                        <input id="hero-search" type="search" placeholder="Name or SKU" {...inputProps} />
                        <button type="button" onClick={() => search(q)} className="btn-signal stamp">Search</button>
                    </div>
                )}
            </SearchSuggest>
        </form>
    );
}

export default function Home({ stats, brands, categories }) {
    const { routes } = usePage().props;

    // The curtain is a first-visit moment, once per browser session.
    const [skipIntro, setSkipIntro] = useState(true);
    useEffect(() => {
        try {
            if (!window.sessionStorage.getItem('lct-intro-seen')) {
                setSkipIntro(false);
                window.sessionStorage.setItem('lct-intro-seen', '1');
            }
        } catch {
            /* storage blocked: skip the curtain */
        }
    }, []);

    const shop = (params) => `${routes.catalog}?${new URLSearchParams(params)}`;

    const touchQuery = '(hover: none), (max-width: 1024px)';
    const [touch, setTouch] = useState(() => window.matchMedia(touchQuery).matches);
    useEffect(() => {
        const mq = window.matchMedia(touchQuery);
        const onChange = () => setTouch(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return (
        <SiteLayout
            title="LCT Trading · Tools & Hardware Supply"
            description="Power tools, hand tools, electrical and plumbing hardware from Makita, Bosch, DeWalt, Stanley, Ingco, Royu and more. Search by SKU, see price and stock, and send your order."
        >
            <Transition
                skip={skipIntro}
                introDuration={1.2}
                transitionDuration={0.9}
                type="curved"
                direction="bottom"
                intro={<img src="/images/lct-mark.webp" alt="" className="sx-intro-mark" aria-hidden="true" />}
            >
                {/* ------------------------------------------------------------ Hero */}
                <section className="hero" id="home">
                    <div className="wrap hero-grid">
                        <div className="hero-content reveal is-visible">
                            <AnimatedHeading as="h1" text="Tools and hardware, ordered in minutes." delay={0.35} />
                            <p className="lede">
                                {number(stats.items)} items from {stats.brands} brands contractors already trust. Find it by SKU, see the price and stock, send the order. We confirm by phone.
                            </p>
                            <HeroSearch />
                            <div className="hero-actions">
                                <Button href={routes.catalog} variant="primary" icon={<CartIcon />} layered>
                                    Shop all items
                                </Button>
                                <Button href="#how" variant="onImage" icon="bx-list-check" layered>
                                    How ordering works
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="hero-trust-wrap">
                        <div className="hero-trust">
                            <StatsCount
                                showDividers
                                stats={[
                                    { value: stats.items, label: 'Items listed' },
                                    { value: stats.brands, label: 'Brands' },
                                    { value: stats.categories, label: 'Categories' },
                                ]}
                            />
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------- Brand marquee */}
                <section className="certs lct-brands" aria-label="Brands">
                    {/* full width: the loop runs edge to edge and fades out with a mask */}
                    <LogoLoop
                        className="lct-logoloop"
                        logos={brands.map((b) => ({
                            src: b.logo,
                            alt: b.name,
                            title: `Shop ${b.name}`,
                            // Phones and tablets: logos only light up on tap, no link.
                            href: touch ? undefined : shop({ brand: b.name }),
                        }))}
                        speed={60}
                        logoHeight={40}
                        gap={72}
                        pauseOnHover
                        scaleOnHover
                        ariaLabel="Brands LCT carries"
                    />
                </section>

                {/* ------------------------------------------------------------ About */}
                <section className="about" id="about">
                    <div className="wrap about-grid">
                        <Reveal className="about-card lct-logo-card" from="left">
                            <img src="/images/lct-logo.webp" alt="LCT Trading, Tools & Hardware Supply" width="560" height="700" />
                        </Reveal>
                        <Reveal from="right">
                            <AnimatedHeading as="h2" text="One supplier for the whole job." />
                            <p className="lede">
                                LCT Trading supplies power tools, hand tools, electrical, plumbing and general hardware. Order what you need for a job in one go, from breakers and wire to grinders and drill bits.
                            </p>
                            <div style={{ marginTop: 'var(--space-4)' }}>
                                <Button href={routes.catalog} variant="secondary" size="sm" icon={<BrowseIcon />} orb>
                                    Browse the catalog
                                </Button>
                            </div>
                            <div className="badge-grid">
                                {REASONS.map(({ Icon, title, copy }) => (
                                    <div className="badge" key={title}>
                                        <Icon className="lct-badge-icon" />
                                        <div>
                                            <strong>{title}</strong>
                                            <p>{copy}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ------------------------------------------------------- Categories */}
                <section className="services" id="categories">
                    <div className="wrap">
                        <SectionHead title="Shop by category." lede="The most stocked categories right now. Every one opens straight to the list, ready to add." />
                        <div className="service-grid">
                            {categories.map((c, i) => (
                                <Reveal key={c.name} index={i}>
                                    <Card className="sx-spotlight service-card group relative h-full overflow-hidden border">
                                        <CardContent>
                                        <div className="service-image lct-category-photo">
                                            {c.image && <img src={c.image} alt="" loading="lazy" />}
                                        </div>
                                        <div className="service-body">
                                            <AnimatedHeading as="h3" text={c.name} />
                                            <p>{number(c.count)} items</p>
                                            <Button href={shop({ category: c.name })} variant="secondary" size="sm" icon={<BrowseIcon />} orb>
                                                Browse items
                                            </Button>
                                        </div>
                                        </CardContent>
                                    </Card>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------- Feature */}
                <section className="feature-band">
                    <div className="wrap feature-grid">
                        <Reveal from="left">
                            <AnimatedHeading as="h2" text="Know the SKU? Skip the browsing." />
                            <p>
                                Contractors can switch the shop to list view: one row per item, SKU first, quantity typed straight in. Build a 40-line order without opening a single product page.
                            </p>
                            <div className="feature-actions">
                                <Button href={routes.catalog} variant="onBrand" icon="bx-list-ul" layered>
                                    Open the shop
                                </Button>
                                <Button href="#contact" variant="onBrandGhost" icon="bxs-phone" layered>
                                    Ask about bulk orders
                                </Button>
                            </div>
                        </Reveal>
                        <Reveal className="lct-slip" from="right" aria-hidden="true">
                            <div className="lct-slip-row"><span>DHP485Z</span><span>× 2</span></div>
                            <div className="lct-slip-row"><span>GA4030</span><span>× 1</span></div>
                            <div className="lct-slip-row"><span>RMB1P100C10</span><span>× 12</span></div>
                            <div className="lct-slip-row"><span>HSL28060</span><span>× 3</span></div>
                            <div className="lct-slip-foot">Sample order slip</div>
                        </Reveal>
                    </div>
                </section>

                {/* ------------------------------------------------------ How to order */}
                <section className="rates" id="how">
                    <div className="wrap">
                        <SectionHead title="How ordering works." lede="No account and no online payment. Your order is a request; LCT confirms everything with you first." />
                        {/* Staircase: each step sits higher than the one before. */}
                        <OrderSteps />
                        <div className="mt-10 flex justify-center">
                            <Button href={routes.catalog} variant="onBrand" icon={<CartIcon />} size="lg" layered>
                                Start an order
                            </Button>
                        </div>
                    </div>
                </section>

                <ContactBlock />
            </Transition>
        </SiteLayout>
    );
}
