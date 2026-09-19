/** Placeholder shown while listings load, shaped like ListingCard so the layout does not jump. */
export default function ListingCardSkeleton() {
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
