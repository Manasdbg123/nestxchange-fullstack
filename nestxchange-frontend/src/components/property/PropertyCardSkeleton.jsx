/**
 * Placeholder shown while listings load.
 *
 * Shaped like the card it replaces so the layout does not jump when the real
 * content arrives.
 */
export default function PropertyCardSkeleton({ layout = 'list' }) {
    if (layout === 'grid') {
        return (
            <div className="surface overflow-hidden" aria-hidden="true">
                <div className="skeleton h-48 w-full" />
                <div className="space-y-3 p-4">
                    <div className="skeleton h-5 w-3/5 rounded" />
                    <div className="skeleton h-3.5 w-2/5 rounded" />
                    <div className="skeleton h-3.5 w-1/3 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="surface flex flex-col overflow-hidden md:flex-row" aria-hidden="true">
            <div className="skeleton h-56 w-full md:h-auto md:w-80 md:shrink-0" />
            <div className="flex-1 space-y-4 p-5">
                <div className="flex justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="skeleton h-6 w-2/3 rounded" />
                        <div className="skeleton h-4 w-1/2 rounded" />
                    </div>
                    <div className="skeleton h-8 w-28 rounded" />
                </div>
                <div className="skeleton h-16 w-full rounded-xl" />
                <div className="flex justify-between">
                    <div className="skeleton h-4 w-36 rounded" />
                    <div className="skeleton h-9 w-32 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
