// Boxicons v3.0.8, https://boxicons.com (free license: https://docs.boxicons.com/free).
// Picked for LCT; sized by font-size (1em) so they drop in where a `bx` <i> was.
const Bx = ({ d, className = '', ...rest }) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false" className={`lct-bx inline-block shrink-0 ${className}`} {...rest}>
        <path d={d} />
    </svg>
);

/** Browse: a magnifier inside a scan frame. */
export const BrowseIcon = (p) => (
    <Bx {...p} d="M7 11.5c0 2.48 2.02 4.5 4.5 4.5.88 0 1.69-.26 2.39-.7l1.91 1.91 1.41-1.41-1.91-1.91c.44-.69.7-1.51.7-2.39C16 9.02 13.98 7 11.5 7S7 9.02 7 11.5M5 5h4V3H5c-1.1 0-2 .9-2 2v4h2zm0 16h4v-2H5v-4H3v4c0 1.1.9 2 2 2m16-6h-2v4h-4v2h4c1.1 0 2-.9 2-2zm0-10c0-1.1-.9-2-2-2h-4v2h4v4h2z" />
);

export const PackageIcon = (p) => (
    <Bx {...p} d="M21.93 7.67a1 1 0 0 0-.07-.17c-.02-.03-.04-.05-.06-.08-.03-.04-.06-.09-.1-.13-.03-.03-.06-.04-.08-.07-.04-.03-.07-.06-.11-.09h-.01l-9.01-5a.99.99 0 0 0-.97 0l-9.01 5H2.5c-.04.02-.08.06-.11.09a.3.3 0 0 0-.08.07c-.04.04-.07.08-.1.13-.02.03-.04.05-.06.08-.03.05-.05.11-.07.17 0 .02-.02.05-.03.07-.02.08-.04.17-.04.26v8c0 .36.2.7.51.87l9 5s.1.04.14.06c.03.01.06.03.09.03a1.1 1.1 0 0 0 .5 0c.03 0 .06-.02.09-.03.05-.02.1-.03.14-.06l9-5c.32-.18.51-.51.51-.87V8c0-.09-.01-.18-.04-.26 0-.03-.02-.05-.03-.07ZM12 4.15l6.94 3.86-2.44 1.36-6.94-3.86zm-4.5 2.5 6.94 3.86L12 11.87 5.06 8.01zM20 15.42l-7 3.89V13.6l2.5-1.39v3.21l2-1.11V11.1L20 9.71z" />
);

/** SKU: a barcode. */
export const SkuIcon = (p) => (
    <Bx {...p} d="M5 5h2v14H5zm13 0h3v14h-3zM8 5h1v14H8zm8 0h1v14h-1zm-4 0h3v14h-3zm-2 0h1v14h-1zM3 5h1v14H3z" />
);

/** Pay: a card. */
export const PayIcon = (p) => (
    <Bx {...p} d="M20 4H4c-1.1 0-2 .9-2 2v2h20V6c0-1.1-.9-2-2-2M2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-6H2zm4-3h6v2H6z" />
);

/** Deliver or pick up: a storefront. */
export const StoreIcon = (p) => (
    <Bx {...p} d="M20 2H4c-1.1 0-2 .9-2 2v4c0 1.01.39 1.91 1 2.62V20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9.38c.61-.7 1-1.61 1-2.62V4c0-1.1-.9-2-2-2M8 8c0 1.1-.9 2-2 2s-2-.9-2-2V4h4zm2-4h4v4c0 1.1-.9 2-2 2s-2-.9-2-2zm5 16H9v-5c0-.55.45-1 1-1h4c.55 0 1 .45 1 1zm5-12c0 1.1-.9 2-2 2s-2-.9-2-2V4h4z" />
);

/** Add to tray: cart with a plus. */
export const CartAddIcon = (p) => (
    <Bx {...p} d="M10 18a2 2 0 1 0 0 4 2 2 0 1 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 1 0 0-4m4-12H7.05L5.94 2.68A1 1 0 0 0 4.99 2h-3v2h2.28l3.54 10.63A2 2 0 0 0 9.71 16h7.59a2 2 0 0 0 1.87-1.3l2.76-7.35A.997.997 0 0 0 21 6m-4.5 6h-2v2h-2v-2h-2v-2h2V8h2v2h2z" />
);

/** In the tray: cart with a check. */
export const CartCheckIcon = (p) => (
    <Bx {...p} d="M10 18a2 2 0 1 0 0 4 2 2 0 1 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 1 0 0-4m4-12H7.05L5.94 2.68A1 1 0 0 0 4.99 2h-3v2h2.28l3.54 10.63A2 2 0 0 0 9.71 16h7.59a2 2 0 0 0 1.87-1.3l2.76-7.35A.997.997 0 0 0 21 6m-8 7.91-2.71-2.71 1.41-1.41 1.29 1.29 3.29-3.29 1.41 1.41-4.71 4.71Z" />
);

/** Cart / shop. */
export const CartIcon = (p) => (
    <Bx {...p} d="M21 6H7.05L5.94 2.68A1 1 0 0 0 4.99 2h-3v2h2.28l3.54 10.63A2 2 0 0 0 9.71 16h7.59a2 2 0 0 0 1.87-1.3l2.76-7.35A.997.997 0 0 0 21 6M10 18a2 2 0 1 0 0 4 2 2 0 1 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 1 0 0-4" />
);
