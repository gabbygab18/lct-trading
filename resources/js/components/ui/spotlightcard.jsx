import React from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';

// ScrollX UI — @scrollxui/spotlightcard (MIT). Converted to JSX.
// Default spotlight colour changed from sky-500 to the site's --green-accent
// (#00754A) expressed as RGB channels, which is what the component expects.

export function SpotlightCard({
    spotlightColor = '0, 117, 74',
    children,
    className,
    style,
    ...props
}) {
    const spotlightX = useMotionValue(0);
    const spotlightY = useMotionValue(0);

    const backgroundImage = useMotionTemplate`radial-gradient(300px circle at ${spotlightX}px ${spotlightY}px, rgba(${spotlightColor}, 0.15), transparent)`;

    const handleMouseMove = (e) => {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        spotlightX.set(e.clientX - left);
        spotlightY.set(e.clientY - top);
    };

    return (
        <Card
            className={`sx-spotlight group relative overflow-hidden border ${className ?? ''}`}
            style={{ '--spotlight-color': spotlightColor, ...style }}
            onMouseMove={handleMouseMove}
            {...props}
        >
            <motion.div
                className="pointer-events-none absolute inset-0 z-10 opacity-0 transition duration-300 group-hover:opacity-100"
                style={{ backgroundImage }}
                aria-hidden="true"
            />
            <CardContent>{children}</CardContent>
        </Card>
    );
}

export default SpotlightCard;
