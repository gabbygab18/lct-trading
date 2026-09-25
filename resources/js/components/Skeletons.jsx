/**
 * Loading placeholders shaped like the real cards, so nothing jumps when the
 * items land. `lct-skel` (app.css) is the shimmer; it goes still under
 * reduced motion.
 */
const Bar = ({ className = '' }) => <span className={`lct-skel block rounded-[3px] ${className}`} />;

export function PocketSkeleton() {
    return (
        <div className="flex flex-col rounded-[6px] bg-foam-700 p-2" aria-hidden="true">
            <span className="lct-skel lct-skel-light block aspect-[5/4] rounded-[4px]" />
            <div className="mt-2 rounded-[4px] bg-steel-100/90 px-2.5 pb-2.5 pt-2.5">
                <div className="flex justify-between gap-3">
                    <Bar className="lct-skel-light h-3 w-20" />
                    <Bar className="lct-skel-light h-3 w-10" />
                </div>
                <Bar className="lct-skel-light mt-2.5 h-3.5 w-full" />
                <Bar className="lct-skel-light mt-1.5 h-3.5 w-3/5" />
                <Bar className="lct-skel-light mt-3.5 h-6 w-24" />
                <span className="mt-3 block h-10 w-full animate-pulse rounded-[6px] bg-signal/25" />
            </div>
        </div>
    );
}

export function ListRowSkeleton() {
    return (
        <li className="grid grid-cols-[48px_1fr_auto] items-center gap-3 px-3 py-2.5" aria-hidden="true">
            <span className="lct-skel lct-skel-light block size-12 rounded-[3px]" />
            <span>
                <Bar className="h-3.5 w-28" />
                <Bar className="mt-2 h-3 w-4/5" />
            </span>
            <Bar className="h-8 w-20 rounded-[6px]" />
        </li>
    );
}

/** The whole grid or list while a new page of items is on its way. */
export function CatalogSkeleton({ view, count = 10 }) {
    const items = Array.from({ length: count });
    return (
        <div role="status" aria-live="polite">
            <span className="sr-only">Loading items…</span>
            {view === 'list' ? (
                <ul className="divide-y divide-foam-600 overflow-hidden rounded-[6px] bg-foam-700/60 ring-1 ring-foam-600">
                    {items.map((_, i) => <ListRowSkeleton key={i} />)}
                </ul>
            ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 min-[85rem]:grid-cols-5">
                    {items.map((_, i) => <PocketSkeleton key={i} />)}
                </div>
            )}
        </div>
    );
}
