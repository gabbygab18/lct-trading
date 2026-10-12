import { Head, usePage } from '@inertiajs/react';

/**
 * Keeps <title> and the description in step with the server's (App\Support\Seo)
 * as visitors move between pages without a full reload.
 */
export default function SeoHead() {
    const { seo } = usePage().props;
    if (!seo) return null;

    return (
        <Head>
            <title>{seo.title}</title>
            <meta head-key="description" name="description" content={seo.description} />
        </Head>
    );
}
