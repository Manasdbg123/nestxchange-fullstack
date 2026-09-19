import { useState } from 'react';
import { Link } from 'react-router-dom';

import Icon from '../ui/Icon';
import { Badge } from '../ui/Primitives';
import {
    describeProperty,
    formatCurrency,
    formatDate,
    formatNumber,
    humanise,
    isAvailableNow,
} from '../../lib/format';

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800';

/**
 * Swaps in the placeholder when a photo fails to load.
 *
 * Listing photos are remote URLs that can rot - three of the seeded ones had
 * already 404'd upstream, leaving blank grey rectangles where a property
 * should be. The guard stops an infinite loop if the placeholder itself fails.
 */
function handleImageError(event) {
    const image = event.currentTarget;
    if (image.src !== FALLBACK_IMAGE) {
        image.src = FALLBACK_IMAGE;
    }
}

/**
 * One listing, in list, grid or compact form.
 *
 * The card was previously a `<div>` with an `onClick`, which is invisible to
 * keyboard and screen-reader users. It is now a "stretched link": the title is
 * a real `<a>` whose ::after pseudo-element covers the whole card, so the
 * entire surface is clickable while remaining a single, properly labelled tab
 * stop. The photo and shortlist controls sit above that overlay on their own
 * z-index rather than being nested inside the anchor, which would be invalid
 * HTML and unreachable by keyboard.
 */
export default function PropertyCard({ property, layout = 'list', isFavorited, onToggleFavorite }) {
    const images = property.images?.length ? property.images : null;
    const [imageIndex, setImageIndex] = useState(0);

    const currentImage = images ? images[imageIndex % images.length].imageUrl : FALLBACK_IMAGE;
    const available = isAvailableNow(property);
    const heading = describeProperty(property);

    const step = (direction) => () =>
        setImageIndex((index) => (index + direction + images.length) % images.length);

    const titleLink = (className) => (
        <Link
            to={`/property/${property.id}`}
            className={`${className} after:absolute after:inset-0 after:content-['']`}
        >
            {heading}
            <span className="sr-only">
                {` in ${property.locality}, ${property.city}, ${formatCurrency(
                    property.rentAmount,
                )} per month`}
            </span>
        </Link>
    );

    const galleryControls = images && images.length > 1 && (
        <div className="absolute inset-0 z-20 flex items-center justify-between px-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
                type="button"
                onClick={step(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/50 text-white backdrop-blur transition-colors hover:bg-ink-950/80"
            >
                <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.5} />
                <span className="sr-only">Previous photo of {heading}</span>
            </button>
            <button
                type="button"
                onClick={step(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/50 text-white backdrop-blur transition-colors hover:bg-ink-950/80"
            >
                <Icon name="chevronRight" className="h-4 w-4" strokeWidth={2.5} />
                <span className="sr-only">Next photo of {heading}</span>
            </button>
        </div>
    );

    const badges = (
        <div className="absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
            <Badge tone="brand" icon="wallet">
                Zero brokerage
            </Badge>
            {property.verified ? (
                <Badge tone="info" icon="shield">
                    Verified
                </Badge>
            ) : null}
            {available ? (
                <Badge tone="success" icon="lightning">
                    Move in now
                </Badge>
            ) : null}
        </div>
    );

    const favoriteButton = onToggleFavorite ? (
        <button
            type="button"
            onClick={() => onToggleFavorite(property.id)}
            aria-pressed={Boolean(isFavorited)}
            className="absolute right-3 top-3 z-20 rounded-full bg-white/90 p-2 shadow transition-transform hover:scale-110 dark:bg-ink-900/90"
        >
            <Icon
                name="heart"
                filled={Boolean(isFavorited)}
                className={`h-4 w-4 ${isFavorited ? 'text-accent-500' : 'text-ink-400'}`}
                strokeWidth={2}
            />
            <span className="sr-only">
                {isFavorited ? `Remove ${heading} from shortlist` : `Save ${heading} to shortlist`}
            </span>
        </button>
    ) : null;

    if (layout === 'compact') {
        return (
            <article className="surface card-hover relative flex gap-3 overflow-hidden p-2">
                <img
                    src={currentImage}
                    alt=""
                    loading="lazy"
                    onError={handleImageError}
                    className="h-20 w-24 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1 py-1">
                    <h3 className="truncate text-sm font-bold text-ink-900 dark:text-ink-50">
                        {titleLink('hover:text-brand-600 dark:hover:text-brand-300')}
                    </h3>
                    <p className="truncate text-xs text-ink-500 dark:text-ink-400">
                        {property.locality}, {property.city}
                    </p>
                    <p className="mt-1.5 font-display text-sm font-bold text-brand-600 dark:text-brand-300">
                        {formatCurrency(property.rentAmount)}
                        <span className="ml-1 text-[10px] font-medium text-ink-400">/mo</span>
                    </p>
                </div>
            </article>
        );
    }

    if (layout === 'grid') {
        return (
            <article className="surface card-hover group relative flex flex-col overflow-hidden">
                <div className="relative h-48 w-full overflow-hidden bg-ink-100 dark:bg-ink-800">
                    <img
                        src={currentImage}
                        alt=""
                        loading="lazy"
                        onError={handleImageError}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {badges}
                    {favoriteButton}
                    {galleryControls}
                </div>

                <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="truncate font-display text-base font-bold text-ink-900 dark:text-ink-50">
                            {titleLink('hover:text-brand-600 dark:hover:text-brand-300')}
                        </h3>
                        <p className="shrink-0 font-display text-lg font-bold text-brand-600 dark:text-brand-300">
                            {formatCurrency(property.rentAmount)}
                        </p>
                    </div>

                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-ink-500 dark:text-ink-400">
                        <Icon name="pin" className="h-3.5 w-3.5 shrink-0" />
                        {property.locality}, {property.city}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                        <SpecChip icon="ruler">{formatNumber(property.squareFootage)} sq.ft</SpecChip>
                        <SpecChip icon="bed">{humanise(property.furnishingStatus)}</SpecChip>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-xs dark:border-ink-800">
                        <span className="text-ink-500 dark:text-ink-400">
                            Deposit {formatCurrency(property.depositAmount)}
                        </span>
                        <span aria-hidden="true" className="font-semibold text-accent-600 dark:text-accent-400">
                            View details →
                        </span>
                    </div>
                </div>
            </article>
        );
    }

    // Default: the wide list row.
    return (
        <article className="surface card-hover group relative flex flex-col overflow-hidden md:flex-row">
            <div className="relative h-56 w-full shrink-0 overflow-hidden bg-ink-100 md:h-auto md:w-80 dark:bg-ink-800">
                <img
                    src={currentImage}
                    alt=""
                    loading="lazy"
                    onError={handleImageError}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {badges}
                {favoriteButton}
                {galleryControls}
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate font-display text-xl font-bold text-ink-900 dark:text-ink-50">
                            {titleLink('hover:text-brand-600 dark:hover:text-brand-300')}
                        </h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400">
                            <Icon name="pin" className="h-4 w-4 shrink-0 text-brand-500" />
                            {property.locality}, {property.city}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="font-display text-2xl font-extrabold text-brand-600 dark:text-brand-300">
                            {formatCurrency(property.rentAmount)}
                        </p>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                            {property.negotiable ? 'Negotiable' : 'Per month'}
                        </p>
                    </div>
                </div>

                {property.amenities?.length ? (
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                        {property.amenities.slice(0, 5).map((amenity) => (
                            <li
                                key={amenity}
                                className="rounded-md border border-brand-100 bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-900/30 dark:text-brand-200"
                            >
                                {amenity}
                            </li>
                        ))}
                        {property.amenities.length > 5 ? (
                            <li className="px-1 py-1 text-[11px] text-ink-400">
                                +{property.amenities.length - 5} more
                            </li>
                        ) : null}
                    </ul>
                ) : null}

                <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-100 bg-ink-100 sm:grid-cols-4 dark:border-ink-800 dark:bg-ink-800">
                    <Stat label="Built-up area" value={`${formatNumber(property.squareFootage)} sq.ft`} />
                    <Stat label="Furnishing" value={humanise(property.furnishingStatus)} />
                    <Stat label="Deposit" value={formatCurrency(property.depositAmount)} />
                    <Stat
                        label="Available"
                        value={available ? 'Immediately' : formatDate(property.availableFrom)}
                    />
                </dl>

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-ink-400">
                        Preferred tenants: {humanise(property.tenantPreference) || 'Anyone'}
                    </p>
                    {/* Presentational: the stretched title link already covers the
                        whole card, so a second control here would be a duplicate
                        tab stop leading to the same place. */}
                    <span aria-hidden="true" className="btn-primary btn-sm">
                        Contact owner
                        <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                </div>
            </div>
        </article>
    );
}

function Stat({ label, value }) {
    return (
        <div className="bg-white px-3 py-2.5 text-center dark:bg-ink-900">
            <dd className="truncate font-display text-sm font-bold text-ink-900 dark:text-ink-50">{value}</dd>
            <dt className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">{label}</dt>
        </div>
    );
}

function SpecChip({ icon, children }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-1 text-[11px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
            <Icon name={icon} className="h-3 w-3" />
            {children}
        </span>
    );
}
