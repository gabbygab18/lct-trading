import React, { useEffect, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import Button from '@/components/ui/Button';
import Loader from '@/components/scrollxui/Loader';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** A floating-label field, elnovian's `.field` pattern. */
function Field({ form, name, label, full, as = 'input', ...rest }) {
    const Tag = as;
    const error = form.errors[name];
    return (
        <div className={`field${full ? ' full' : ''}`}>
            <Tag
                id={`c-${name}`}
                name={name}
                value={form.data[name]}
                onChange={(e) => form.setData(name, e.target.value)}
                placeholder=" "
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? `c-${name}-err` : undefined}
                className={error ? 'lct-field-error' : ''}
                {...rest}
            />
            <label htmlFor={`c-${name}`}>{label}</label>
            {error && <span id={`c-${name}-err`} className="error-msg">{error}</span>}
        </div>
    );
}

/** Contact form on the homepage. Saves to Admin → Inquiries and emails the store. */
export default function ContactForm() {
    const { routes, inquiryTopics = {}, flash = {} } = usePage().props;
    const [sentTo, setSentTo] = useState(null);
    const [topicOpen, setTopicOpen] = useState(false);
    const form = useForm({ name: '', phone: '', email: '', topic: 'product', message: '', company_website: '' });

    useEffect(() => {
        if (flash.inquirySent) setSentTo(flash.inquirySent);
    }, [flash.inquirySent]);

    const submit = (e) => {
        e.preventDefault();
        form.post(routes.inquiries, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    if (sentTo) {
        return (
            <div className="lct-contact-card lct-contact-done" role="status">
                <i className="bx bxs-check-circle" aria-hidden="true" />
                <h3>Thanks, {sentTo.split(' ')[0]}. Message sent.</h3>
                <p>We’ll call or text you back during store hours.</p>
                <Button type="button" variant="secondary" size="sm" onClick={() => setSentTo(null)} orb>
                    Send another message
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={submit} noValidate className="lct-contact-card">
            <h3>Send us a message</h3>


            <div className="form-grid">
                {/* Topic: elnovian's dropdown field (the scrollxui menu, floating label) */}
                <div className="field full">
                    <DropdownMenu modal={false} open={topicOpen} onOpenChange={setTopicOpen}>
                        <DropdownMenuTrigger className="field-trigger w-full rounded-none hover:shadow-none">
                            <button type="button" id="c-topic" className={`field-control ${topicOpen ? 'is-open' : ''}`}>
                                <span>{inquiryTopics[form.data.topic]}</span>
                                <i className={`bx bx-chevron-down transition-transform duration-200 ${topicOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" maxHeight="none" className="field-menu w-[var(--radix-dropdown-menu-trigger-width)]">
                            {Object.entries(inquiryTopics).map(([value, label]) => (
                                <DropdownMenuItem key={value} onSelect={() => form.setData('topic', value)}>
                                    <span className={`flex-1 ${form.data.topic === value ? 'text-white' : ''}`}>{label}</span>
                                    {form.data.topic === value && <i className="bx bx-check text-[18px] text-signal" aria-hidden="true" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <label htmlFor="c-topic">What is it about?</label>
                </div>
                <Field form={form} name="name" label="Full name" autoComplete="name" />
                <Field form={form} name="phone" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" />
                <Field form={form} name="email" label="Email (optional)" type="email" autoComplete="email" full />
                <Field form={form} name="message" label="What do you need? SKU, quantity, where it’s going…" as="textarea" rows={4} full />
            </div>
            {/* bots fill this; people never see it */}
            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" value={form.data.company_website} onChange={(e) => form.setData('company_website', e.target.value)} />

            <div className="form-actions">
                <Button type="submit" variant="primary" disabled={form.processing} layered>
                    {form.processing ? (
                        <>
                            <Loader />
                            <span>Sending…</span>
                        </>
                    ) : (
                        'Send message'
                    )}
                </Button>
            </div>
            <p className="form-note">Goes straight to LCT. We reply by phone or text; nothing is charged.</p>
        </form>
    );
}
