import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Icon from '../components/ui/Icon';
import { Alert, Badge, EmptyState, Field, Spinner } from '../components/ui/Primitives';
import Pagination from '../components/property/Pagination';
import usePageMeta from '../hooks/usePageMeta';
import useAsync from '../hooks/useAsync';
import { listingApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';
import { formatCurrency, formatRelative, humanise } from '../lib/format';
import { LISTING_CATEGORIES, LISTING_MODES, LISTING_STATUS_BADGES } from '../lib/constants';

const PAGE_SIZE = 12;
const ATTR_PREFIX = 'attr.';

/**
 * The one search results page for every category - see ListingQueryBuilder
 * on the backend. Category and mode arrive as query params (from the landing
 * page's selector or a filter chip here) and stay visible as a chip the
 * visitor can change or clear without going back to the landing page.
 */
export default function ListingSearch() {
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = useMemo(() => readFilters(searchParams), [searchParams]);
    const page = Number(searchParams.get('page') ?? 0);

    usePageMeta({
        title: filters.category
            ? `${humanise(filters.category)} listings${filters.mode ? ` to ${filters.mode.toLowerCase()}` : ''}`
            : 'Browse listings',
    });

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
        `${searchParams.toString()}|${page}`,
        fetchResults,
    );

    const error = fetchError ? toErrorMessage(fetchError, 'We could not load listings just now.') : '';
    const listings = results?.content ?? [];

    const applyFilters = useCallback(
        (next) => setSearchParams(writeFilters(next)),
        [setSearchParams],
    );

    const changePage = useCallback(
        (nextPage) => {
            const params = writeFilters(filters);
            if (nextPage > 0) params.set('page', String(nextPage));
            setSearchParams(params);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        [filters, setSearchParams],
    );

    const clearCategoryAndMode = () => applyFilters({ ...filters, category: '', mode: '', attributes: {} });

    return (
        <div className="bg-ink-50 pb-12 dark:bg-ink-950">
            <div className="border-b border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
                <div className="container-page py-5">
                    {/* Category/mode filter chip - the visitor can change it here
                        without returning to the landing page. */}
                    <div className="flex flex-wrap items-center gap-2">
                        {filters.category || filters.mode ? (
                            <span className="chip chip-active">
                                {[
                                    LISTING_CATEGORIES.find((c) => c.value === filters.category)?.label,
                                    LISTING_MODES.find((m) => m.value === filters.mode)?.label,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                                <button
                                    type="button"
                                    onClick={clearCategoryAndMode}
                                    aria-label="Clear category and mode filter"
                                    className="ml-1.5"
                                >
                                    <Icon name="close" className="h-3 w-3" strokeWidth={2.5} />
                                </button>
                            </span>
                        ) : null}

                        {LISTING_CATEGORIES.map((entry) => (
                            <button
                                key={entry.value}
                                type="button"
                                onClick={() => applyFilters({ ...filters, category: entry.value, attributes: {} })}
                                aria-pressed={filters.category === entry.value}
                                className={`chip ${filters.category === entry.value ? 'chip-active' : ''}`}
                            >
                                <Icon name={entry.icon} className="h-3.5 w-3.5" strokeWidth={2} />
                                {entry.label}
                            </button>
                        ))}
                        {LISTING_MODES.map((entry) => (
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
                        description="Try widening your price range or clearing a filter."
                    />
                ) : (
                    <>
                        <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
                            {results?.totalElements ?? 0} {results?.totalElements === 1 ? 'listing' : 'listings'}
                        </p>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {listings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                        <Pagination page={results?.pageNo ?? 0} totalPages={results?.totalPages ?? 0} onChange={changePage} />
                    </>
                )}
            </div>
        </div>
    );
}

function ListingCard({ listing }) {
    const statusBadge = LISTING_STATUS_BADGES[listing.status];
    const categoryEntry = LISTING_CATEGORIES.find((entry) => entry.value === listing.category);

    return (
        <Link to={`/listings/${listing.id}`} className="surface flex flex-col gap-3 p-5 transition-shadow hover:shadow-lift">
            <div className="flex items-start justify-between gap-2">
                <span className="chip">
                    <Icon name={categoryEntry?.icon ?? 'tag'} className="h-3.5 w-3.5" strokeWidth={2} />
                    {humanise(listing.category)}
                </span>
                {statusBadge ? <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge> : null}
            </div>

            <h3 className="font-display text-lg font-bold leading-snug text-ink-900 dark:text-ink-50">
                {listing.title}
            </h3>

            <p className="line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{listing.description}</p>

            <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-lg font-extrabold text-brand-600 dark:text-brand-300">
                    {formatCurrency(listing.price)}
                    {listing.mode === 'RENT' ? <span className="text-xs font-medium text-ink-400">/mo</span> : null}
                </span>
                <span className="flex items-center gap-1 text-xs text-ink-400">
                    <Icon name="pin" className="h-3.5 w-3.5" />
                    {listing.location}
                </span>
            </div>

            <p className="text-xs text-ink-400">Posted {formatRelative(listing.createdAt)}</p>
        </Link>
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

function readFilters(params) {
    const attributes = {};
    for (const [key, value] of params.entries()) {
        if (key.startsWith(ATTR_PREFIX)) attributes[key.slice(ATTR_PREFIX.length)] = value;
    }

    return {
        category: params.get('category') ?? '',
        mode: params.get('mode') ?? '',
        priceMin: params.get('priceMin') ?? '',
        priceMax: params.get('priceMax') ?? '',
        location: params.get('location') ?? '',
        attributes,
    };
}

function writeFilters(filters) {
    const params = new URLSearchParams();
    const setIf = (key, value) => {
        if (value !== '' && value !== null && value !== undefined) params.set(key, String(value));
    };

    setIf('category', filters.category);
    setIf('mode', filters.mode);
    setIf('priceMin', filters.priceMin);
    setIf('priceMax', filters.priceMax);
    setIf('location', filters.location);

    Object.entries(filters.attributes ?? {}).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) params.set(`${ATTR_PREFIX}${key}`, value);
    });

    return params;
}
