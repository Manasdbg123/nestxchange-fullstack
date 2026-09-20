import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Icon from '../ui/Icon';
import ListingCard from './ListingCard';
import { Alert, EmptyState, Field, Spinner } from '../ui/Primitives';
import Pagination from './Pagination';
import useAsync from '../../hooks/useAsync';
import useListingFavorites from '../../hooks/useListingFavorites';
import { listingApi } from '../../api/endpoints';
import { toErrorMessage } from '../../api/client';
import { BROWSE_MODES, LISTING_CATEGORIES } from '../../lib/constants';

const PAGE_SIZE = 12;
const ATTR_PREFIX = 'attr.';

/**
 * The one browsing/search experience for every category, whether that's the
 * fully generic /search page or a domain-locked one (/properties,
 * /vehicles). `lockedCategory` is the only thing that changes between them:
 * it hides the category switcher and always searches that category, while
 * everything else - the query builder, the card, the pagination - is shared.
 * A second, near-identical "PropertySearch"/"VehicleSearch" component would
 * be exactly the kind of duplication the unified backend was built to avoid.
 */
export default function MarketplaceBrowser({ lockedCategory = null, emptyStateDescription }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = useMemo(
        () => readFilters(searchParams, lockedCategory),
        [searchParams, lockedCategory],
    );
    const page = Number(searchParams.get('page') ?? 0);
    const { isFavorited, toggleFavorite } = useListingFavorites();

    const [schemas, setSchemas] = useState(null);
    useEffect(() => {
        let cancelled = false;
        listingApi.schemas().then((result) => !cancelled && setSchemas(result)).catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const schema = schemas?.find((entry) => entry.category === filters.category);

    const fetchResults = useCallback(
        () => listingApi.search(filters, { page, size: PAGE_SIZE }),
        [filters, page],
    );

    const { data: results, loading, error: fetchError } = useAsync(
        `${searchParams.toString()}|${page}|${lockedCategory ?? ''}`,
        fetchResults,
    );

    const error = fetchError ? toErrorMessage(fetchError, 'We could not load listings just now.') : '';
    const listings = results?.content ?? [];

    const applyFilters = useCallback(
        (next) => setSearchParams(writeFilters(next, lockedCategory)),
        [setSearchParams, lockedCategory],
    );

    const changePage = useCallback(
        (nextPage) => {
            const params = writeFilters(filters, lockedCategory);
            if (nextPage > 0) params.set('page', String(nextPage));
            setSearchParams(params);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        [filters, setSearchParams, lockedCategory],
    );

    return (
        <div className="bg-ink-50 pb-12 dark:bg-ink-950">
            <div className="border-b border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
                <div className="container-page py-5">
                    {/* Only the fully generic /search page lets you switch
                        category - the dedicated marketplace pages are always
                        that one category, by design. "All" (an empty category
                        filter) is its own explicit option so it's clear this is
                        a three-way choice, not just two categories you can turn
                        on. */}
                    {!lockedCategory ? (
                        <div
                            role="group"
                            aria-label="Filter by category"
                            className="mb-3 inline-flex rounded-xl border border-ink-200 bg-ink-50 p-1 dark:border-ink-700 dark:bg-ink-800/60"
                        >
                            <button
                                type="button"
                                onClick={() => applyFilters({ ...filters, category: '', attributes: {} })}
                                aria-pressed={!filters.category}
                                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                                    !filters.category
                                        ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-ink-50'
                                        : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100'
                                }`}
                            >
                                All
                            </button>
                            {LISTING_CATEGORIES.map((entry) => (
                                <button
                                    key={entry.value}
                                    type="button"
                                    onClick={() => applyFilters({ ...filters, category: entry.value, attributes: {} })}
                                    aria-pressed={filters.category === entry.value}
                                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                                        filters.category === entry.value
                                            ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-ink-50'
                                            : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100'
                                    }`}
                                >
                                    <Icon name={entry.icon} className="h-3.5 w-3.5" strokeWidth={2} />
                                    {entry.label}
                                </button>
                            ))}
                        </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                        {BROWSE_MODES.map((entry) => (
                            <button
                                key={entry.value}
                                type="button"
                                onClick={() => applyFilters({ ...filters, mode: entry.value })}
                                aria-pressed={filters.mode === entry.value}
                                className={`chip ${filters.mode === entry.value ? 'chip-active' : ''}`}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <Field
                            label="Location"
                            aria-label="Location"
                            value={filters.location}
                            onChange={(event) => applyFilters({ ...filters, location: event.target.value })}
                        />
                        <Field
                            label="Min price"
                            type="number"
                            value={filters.priceMin}
                            onChange={(event) => applyFilters({ ...filters, priceMin: event.target.value })}
                        />
                        <Field
                            label="Max price"
                            type="number"
                            value={filters.priceMax}
                            onChange={(event) => applyFilters({ ...filters, priceMax: event.target.value })}
                        />
                    </div>

                    {schema ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {schema.fields.filter((field) => field.filterable).map((field) => (
                                <AttributeFilterInput
                                    key={field.key}
                                    field={field}
                                    values={filters.attributes}
                                    onChange={(attributes) => applyFilters({ ...filters, attributes })}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="container-page pt-6">
                {error ? (
                    <Alert tone="error">{error}</Alert>
                ) : loading ? (
                    <div className="flex justify-center py-16">
                        <Spinner className="h-8 w-8 text-brand-500" />
                    </div>
                ) : listings.length === 0 ? (
                    <EmptyState
                        icon="search"
                        title="No listings match these filters"
                        description={emptyStateDescription ?? 'Try widening your price range or clearing a filter.'}
                    />
                ) : (
                    <>
                        <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
                            {results?.totalElements ?? 0} {results?.totalElements === 1 ? 'listing' : 'listings'}
                        </p>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {listings.map((listing) => (
                                <ListingCard
                                    key={listing.id}
                                    listing={listing}
                                    isFavorited={isFavorited(listing.id)}
                                    onToggleFavorite={toggleFavorite}
                                />
                            ))}
                        </div>
                        <Pagination page={results?.pageNo ?? 0} totalPages={results?.totalPages ?? 0} onChange={changePage} />
                    </>
                )}
            </div>
        </div>
    );
}

function AttributeFilterInput({ field, values, onChange }) {
    if (field.rangeFilterable) {
        return (
            <div className="grid grid-cols-2 gap-2">
                <Field
                    label={`${field.label} min`}
                    type="number"
                    value={values[`${field.key}_min`] ?? ''}
                    onChange={(event) => onChange({ ...values, [`${field.key}_min`]: event.target.value })}
                />
                <Field
                    label={`${field.label} max`}
                    type="number"
                    value={values[`${field.key}_max`] ?? ''}
                    onChange={(event) => onChange({ ...values, [`${field.key}_max`]: event.target.value })}
                />
            </div>
        );
    }

    return (
        <Field
            label={field.label}
            value={values[field.key] ?? ''}
            onChange={(event) => onChange({ ...values, [field.key]: event.target.value })}
        />
    );
}

function readFilters(params, lockedCategory) {
    const attributes = {};
    for (const [key, value] of params.entries()) {
        if (key.startsWith(ATTR_PREFIX)) attributes[key.slice(ATTR_PREFIX.length)] = value;
    }

    return {
        category: lockedCategory ?? (params.get('category') ?? ''),
        mode: params.get('mode') ?? '',
        priceMin: params.get('priceMin') ?? '',
        priceMax: params.get('priceMax') ?? '',
        location: params.get('location') ?? '',
        attributes,
    };
}

function writeFilters(filters, lockedCategory) {
    const params = new URLSearchParams();
    const setIf = (key, value) => {
        if (value !== '' && value !== null && value !== undefined) params.set(key, String(value));
    };

    // A locked marketplace page never puts `category` in the URL - it's
    // implied by the page itself, so the URL stays clean (/vehicles?mode=RENT
    // rather than /vehicles?category=VEHICLE&mode=RENT).
    if (!lockedCategory) setIf('category', filters.category);
    setIf('mode', filters.mode);
    setIf('priceMin', filters.priceMin);
    setIf('priceMax', filters.priceMax);
    setIf('location', filters.location);

    Object.entries(filters.attributes ?? {}).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) params.set(`${ATTR_PREFIX}${key}`, value);
    });

    return params;
}
