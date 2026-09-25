// One stroke weight, one grid (24), drawn for this site.
const Svg = ({ children, className = 'size-5', ...rest }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} {...rest}>
        {children}
    </svg>
);

export const SearchIcon = (p) => (
    <Svg {...p}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
    </Svg>
);

// An open tool case seen from the front: the tray.
export const TrayIcon = (p) => (
    <Svg {...p}>
        <path d="M3 9h18l-1.5 10.5a1 1 0 0 1-1 .5h-13a1 1 0 0 1-1-.5L3 9Z" />
        <path d="M8 9V6.5A1.5 1.5 0 0 1 9.5 5h5A1.5 1.5 0 0 1 16 6.5V9" />
        <path d="M3 13h18" />
    </Svg>
);

export const PlusIcon = (p) => (
    <Svg {...p}>
        <path d="M12 5v14M5 12h14" />
    </Svg>
);

export const MinusIcon = (p) => (
    <Svg {...p}>
        <path d="M5 12h14" />
    </Svg>
);

export const CloseIcon = (p) => (
    <Svg {...p}>
        <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
);

export const TrashIcon = (p) => (
    <Svg {...p}>
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
    </Svg>
);

export const ArrowRightIcon = (p) => (
    <Svg {...p}>
        <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
);

export const ArrowLeftIcon = (p) => (
    <Svg {...p}>
        <path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
);

export const GridIcon = (p) => (
    <Svg {...p}>
        <rect x="4" y="4" width="7" height="7" rx="1" />
        <rect x="13" y="4" width="7" height="7" rx="1" />
        <rect x="4" y="13" width="7" height="7" rx="1" />
        <rect x="13" y="13" width="7" height="7" rx="1" />
    </Svg>
);

export const ListIcon = (p) => (
    <Svg {...p}>
        <path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1" />
    </Svg>
);

export const PhoneIcon = (p) => (
    <Svg {...p}>
        <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
    </Svg>
);

export const CheckIcon = (p) => (
    <Svg {...p}>
        <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
);

export const TruckIcon = (p) => (
    <Svg {...p}>
        <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
        <circle cx="7" cy="17.5" r="1.8" />
        <circle cx="17" cy="17.5" r="1.8" />
    </Svg>
);

export const StoreIcon = (p) => (
    <Svg {...p}>
        <path d="M4 10v10h16V10M3 10l2-6h14l2 6H3ZM9 20v-6h6v6" />
    </Svg>
);

export const ChevronDownIcon = (p) => (
    <Svg {...p}>
        <path d="m6 9 6 6 6-6" />
    </Svg>
);
