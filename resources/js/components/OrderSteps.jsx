import React from 'react';
import AnimatedHeading from '@/components/AnimatedHeading';
import LeanCard from '@/components/scrollxui/LeanCard';
import { BrowseIcon, CartAddIcon } from '@/components/BxIcons';

const STEPS = [
    { title: 'Find it', copy: 'Search by name or SKU, or browse by brand and category.', Icon: BrowseIcon },
    { title: 'Add to tray', copy: 'Set the quantity right on the list. Send the tray with your contact and address.', Icon: CartAddIcon },
    { title: 'We call to confirm', copy: 'LCT checks stock and calls or texts you with the total and delivery fee.', icon: 'bx-phone-call' },
];

/** The three ordering steps as a staircase: each step sits higher than the one before. */
export default function OrderSteps() {
    return (
        <ol className="lct-steps">
            {STEPS.map((step, i) => (
                <li key={step.title}>
                    <LeanCard bare index={i} className="lct-step">
                        <span className="lct-step-icon" aria-hidden="true">
                            {step.Icon ? <step.Icon /> : <i className={`bx ${step.icon}`} />}
                        </span>
                        <AnimatedHeading as="h3" text={step.title} />
                        <p>{step.copy}</p>
                        <span className="lct-step-no" aria-hidden="true">
                            Step {String(i + 1).padStart(2, '0')}
                        </span>
                    </LeanCard>
                </li>
            ))}
        </ol>
    );
}
