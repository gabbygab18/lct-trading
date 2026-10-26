import { createInertiaApp } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import AdminLayout from './layouts/admin-layout';

// The admin: lct-stocks' stack and components (React 19, TypeScript, glint).
// Eager, like lct-stocks: switching pages never waits on a chunk download.
const pages = import.meta.glob('./pages/**/*.tsx', { eager: true }) as Record<
    string,
    { default: { layout?: (page: ReactNode) => ReactNode } }
>;

createInertiaApp({
    title: (title) => (title ? `${title} · LCT Trading` : 'Admin · LCT Trading'),
    resolve: (name) => {
        const page = pages[`./pages/${name}.tsx`];
        // One shell for every signed-in page, kept mounted between visits so the
        // sidebar rail can spring from one link to the next.
        page.default.layout ??= (child) => <AdminLayout>{child}</AdminLayout>;
        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: '#d7141a' },
});

initializeTheme();
