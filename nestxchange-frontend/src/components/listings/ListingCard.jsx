import { Link } from 'react-router-dom';

import Icon from '../ui/Icon';
import { Badge } from '../ui/Primitives';
import { formatCurrency, formatNumber, formatRelative, humanise } from '../../lib/format';
import { LISTING_CATEGORIES, LISTING_STATUS_BADGES } from '../../lib/constants';

/** Shown for a listing with no photos yet - the same pattern PropertyCard uses for a missing/broken image. */
const PLACEHOLDER_IMAGE = {
    PROPERTY: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800',
    VEHICLE: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=800',
};

/**
 * The two or three attribute values worth putting on the card face, per
 * category - everything else stays on the detail page. Reading straight from
 * `listing.attributes` (not a per-category prop) is what lets one card
 * component serve both marketplaces.
 */
const SPEC_PICKS = {
    PROPERTY: [
        { key: 'bedrooms', icon: 'bed', suffix: ' bd' },
        { key: 'bathrooms', icon: 'ruler', suffix: ' ba' },
        { key: 'sqft', icon: 'ruler', suffix: ' sqft', format: formatNumber },
    ],
    VEHICLE: [
        { key: 'make' },
        { key: 'model' },
        { key: 'year' },
    ],
};

export default function ListingCard({ listing, isFavorited, onToggleFavorite }) {
    const statusBadge = LISTING_STATUS_BADGES[listing.status];
    const categoryEntry = LISTING_CATEGORIES.find((entry) => entry.value === listing.category);
    const coverImage =
        listing.images?.find((image) => image.isPrimary)?.imageUrl ??
        listing.images?.[0]?.imageUrl ??
        PLACEHOLDER_IMAGE[listing.category] ??
        PLACEHOLDER_IMAGE.PROPERTY;
    const specs = (SPEC_PICKS[listing.category] ?? [])
        .map((spec) => {
            const value = listing.attributes?.[spec.key];
            if (value === undefined || value === null || value === '') return null;
            const formatted = spec.format ? spec.format(value) : value;
            return { ...spec, display: `${formatted}${spec.suffix ?? ''}` };
        })
        .filter(Boolean);

    return (
        <Link
            to={`/listings/${listing.id}`}
            className="surface card-hover group relative flex flex-col overflow-hidden"
        >
            <div className="relative h-44 w-full overflow-hidden bg-ink-100 dark:bg-ink-800">
                <img
                    src={coverImage}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                    <Badge tone="muted" icon={categoryEntry?.icon}>
                        {humanise(listing.mode)}
                    </Badge>
                </div>
                {statusBadge && listing.status !== 'AVAILABLE' ? (
                    <div className="absolute right-3 top-3">
                        <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
                    </div>
                ) : null}
                {onToggleFavorite ? (
                    <button
                        type="button"
                        onClick={(event) => {
                            // Without stopPropagation, this click bubbles up to
                            // the surrounding <Link> and navigates to the
                            // listing anyway - preventDefault alone only stops
                            // this button's own default action, not the
                            // separate onClick handler React Router attaches
                            // to the anchor.
                            event.preventDefault();
                            event.stopPropagation();
                            onToggleFavorite(listing.id);
                        }}
                        aria-pressed={Boolean(isFavorited)}
                        className="absolute bottom-2 right-2 rounded-full bg-white/90 p-2 shadow transition-transform hover:scale-110 dark:bg-ink-900/90"
                    >
                        <Icon
                            name="heart"
                            filled={Boolean(isFavorited)}
                            className={`h-4 w-4 ${isFavorited ? 'text-accent-500' : 'text-ink-400'}`}
                            strokeWidth={2}
                        />
                        <span className="sr-only">
                            {isFavorited ? `Remove ${listing.title} from shortlist` : `Save ${listing.title} to shortlist`}
                        </span>
                    </button>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="truncate font-display text-base font-bold text-ink-900 dark:text-ink-50">
                        {listing.title}
                    </h3>
                    <p className="shrink-0 font-display text-base font-bold text-brand-600 dark:text-brand-300">
                        {formatCurrency(listing.price)}
                        {listing.mode === 'RENT' ? (
                            <span className="text-[10px] font-medium text-ink-400">/mo</span>
                        ) : null}
                    </p>
                </div>

                <p className="mt-1 flex items-center gap-1 truncate text-xs text-ink-500 dark:text-ink-400">
                    <Icon name="pin" className="h-3.5 w-3.5 shrink-0" />
                    {listing.location}
                </p>

                {specs.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {specs.map((spec) => (
                            <span
                                key={spec.key}
                                className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-1 text-[11px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                            >
                                {spec.icon ? <Icon name={spec.icon} className="h-3 w-3" /> : null}
                                {spec.display}
                            </span>
                        ))}
                    </div>
                ) : null}

                <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-[11px] text-ink-400 dark:border-ink-800">
                    <span>Posted {formatRelative(listing.createdAt)}</span>
                    <span aria-hidden="true" className="font-semibold text-accent-600 dark:text-accent-400">
                        View details →
                    </span>
                </div>
            </div>
        </Link>
    );
}
