import { cn } from '@/lib/utils';

/**
 * ScrollXUI-style `loader` — a compact dual-ring spinner in brand
 * colors. Used on submitting forms.
 */
export default function Loader({ className, size = 18 }) {
    return (
        <span
            role="status"
            aria-label="Loading"
            className={cn('relative inline-block', className)}
            style={{ width: size, height: size }}
        >
            <span className="absolute inset-0 rounded-full border-2 border-current opacity-25" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-current" />
        </span>
    );
}
