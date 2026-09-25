import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { TrayProvider } from './lib/tray';
import { ToastContainer } from './components/ui/toast';

const appName = import.meta.env.VITE_APP_NAME || 'LCT Trading';

createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : `${appName} · Tools & Hardware Supply`),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        return pages[`./Pages/${name}.jsx`];
    },
    setup({ el, App, props }) {
        // The tray sits above every page so it survives navigation.
        createRoot(el).render(
            <TrayProvider>
                <App {...props} />
                <ToastContainer />
            </TrayProvider>,
        );
    },
    progress: {
        color: '#d7141a',
        showSpinner: false,
    },
});
