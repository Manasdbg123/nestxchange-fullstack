import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import PropertyCard from '../components/property/PropertyCard';
import PropertyCardSkeleton from '../components/property/PropertyCardSkeleton';
import PropertyFilters from '../components/property/PropertyFilters';
import Pagination from '../components/property/Pagination';
import Icon from '../components/ui/Icon';
import { Alert, EmptyState, Field, Modal, Spinner } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import useFavorites from '../hooks/useFavorites';
import useAsync from '../hooks/useAsync';
import { propertyApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';
import { PROPERTY_CATEGORIES } from '../lib/constants';
import { formatNumber } from '../lib/format';

// Leaflet is heavy and most visitors never switch to map view.
const PropertyMap = lazy(() => import('../components/property/PropertyMap'));

const PAGE_SIZE = 12;

/**
 * The listings page.
 *
 * Two structural changes from the previous version:
 *
 *  1. Filters live in the URL. A search can be bookmarked, shared, and survives
 *     the back button - none of which worked when filters were component state.
 *  2. Every filter is sent to the API. BHK, type, verified-only and
 *     availability used to be applied in the browser to whichever page happened
 *     to be loaded, so the result count was wrong and matches on later pages
 *     were invisible.
 */
export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isFavorited, toggleFavorite } = useFavorites();

    const [layout, setLayout] = useState('list');
    const [hoveredId, setHoveredId] = useState(null);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const filters = useMemo(() => readFilters(searchParams), [searchParams]);
    const page = Number(searchParams.get('page') ?? 0);

    usePageMeta({
        title: filters.city ? `Rentals in ${filters.city}` : 'Rentals across India',
        description: filters.city
            ? `Browse verified rental homes in ${filters.city} with zero brokerage. Contact owners directly on RentNest.`
            : 'Browse verified rental homes across India with zero brokerage. Contact owners directly on RentNest.',
    });

    const fetchResults = useCallback(
        () => propertyApi.search(toApiFilters(filters), { page, size: PAGE_SIZE }),
        [filters, page],
    );

    const {
        data: results,
        loading,
        error: fetchError,
    } = useAsync(`${searchParams.toString()}|${page}`, fetchResults);

    const error = fetchError
        ? toErrorMessage(fetchError, 'We could not load listings just now.')
        : '';

    /** Writing filters back to the URL is what triggers a refetch. */
    const applyFilters = useCallback(
        (next, { resetPage = true } = {}) => {
            const params = writeFilters(next);
            if (!resetPage && page > 0) params.set('page', String(page));
            setSearchParams(params);
        },
        [page, setSearchParams],
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

    const resetFilters = useCallback(() => setSearchParams(new URLSearchParams()), [setSearchParams]);

    const activeCategory =
        PROPERTY_CATEGORIES.find(
            (entry) =>
                entry.types.length === filters.type.length &&
                entry.types.every((type) => filters.type.includes(type)),
        )?.id ?? (filters.type.length === 0 ? 'all' : null);

    const listings = results?.content ?? [];
    const activeFilterCount = countActiveFilters(filters);

    const filterPanel = (
        <PropertyFilters filters={filters} onChange={applyFilters} onReset={resetFilters} />
    );

    return (
        <div className="bg-ink-50 pb-12 dark:bg-ink-950">
            {/* ------------------------------------------------- Search header */}
            <div className="border-b border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
                <div className="container-page py-5">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            applyFilters({ ...filters, keyword: event.target.keyword.value });
                        }}
                        className="flex flex-col gap-3 sm:flex-row"
                    >
                        <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-4 dark:border-ink-700 dark:bg-ink-800">
                            <Icon name="search" className="h-4 w-4 shrink-0 text-ink-400" />
                            <label htmlFor="search-keyword" className="sr-only">
                                Search by city or locality
                            </label>
                            <input
                                id="search-keyword"
                                name="keyword"
                                type="search"
                                defaultValue={filters.keyword}
                                key={filters.keyword}
                                placeholder="Search city or locality"
                                className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400 dark:text-ink-50"
                            />
                        </div>

                        <Field
                            as="select"
                            aria-label="City"
                            value={filters.city}
                            onChange={(event) => applyFilters({ ...filters, city: event.target.value })}
                            className="sm:w-52"
                        >
                            <option value="">All cities</option>
                            {['Bengaluru', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad'].map((city) => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </Field>

                        <button type="submit" className="btn-brand btn-md sm:px-8">
                            Search
                        </button>
                    </form>

                    <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar">
                        {PROPERTY_CATEGORIES.map((entry) => (
                            <button
                                key={entry.id}
                                type="button"
                                onClick={() => applyFilters({ ...filters, type: entry.types })}
                                aria-pressed={activeCategory === entry.id}
                                className={`chip shrink-0 ${activeCategory === entry.id ? 'chip-active' : ''}`}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container-page pt-6">
                <div className="flex gap-8">
                    {/* -------------------------------------------- Filter rail */}
                    <aside className="hidden w-72 shrink-0 lg:block">
                        <div className="sticky top-24">{filterPanel}</div>
                    </aside>

                    {/* ------------------------------------------------ Results */}
                    <section className="min-w-0 flex-1">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">
                                    {loading
                                        ? 'Finding homes…'
                                        : `${formatNumber(results?.totalElements ?? 0)} ${
                                              results?.totalElements === 1 ? 'home' : 'homes'
                                          } available`}
                                </h1>
                                {filters.city ? (
                                    <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
                                        in {filters.city}
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFiltersOpen(true)}
                                    className="btn-secondary btn-sm lg:hidden"
                                >
                                    <Icon name="filter" className="h-4 w-4" />
                                    Filters
                                    {activeFilterCount > 0 ? (
                                        <span className="ml-1 rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                                            {activeFilterCount}
                                        </span>
                                    ) : null}
                                </button>

                                <div
                                    className="flex rounded-lg border border-ink-200 bg-white p-1 dark:border-ink-700 dark:bg-ink-800"
                                    role="group"
                                    aria-label="Result layout"
                                >
                                    {[
                                        { id: 'list', icon: 'list', label: 'List view' },
                                        { id: 'grid', icon: 'grid', label: 'Grid view' },
                                        { id: 'map', icon: 'map', label: 'Map view' },
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setLayout(option.id)}
                                            aria-pressed={layout === option.id}
                                            className={`rounded-md p-2 transition-colors ${
                                                layout === option.id
                                                    ? 'bg-brand-500 text-white'
                                                    : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-700'
                                            }`}
                                        >
                                            <Icon name={option.icon} className="h-4 w-4" />
                                            <span className="sr-only">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {error ? (
                            <Alert tone="error">{error}</Alert>
                        ) : loading ? (
                            <div
                                className={
                                    layout === 'grid'
                                        ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3'
                                        : 'space-y-5'
                                }
                            >
                                {[0, 1, 2].map((key) => (
                                    <PropertyCardSkeleton
                                        key={key}
                                        layout={layout === 'grid' ? 'grid' : 'list'}
                                    />
                                ))}
                            </div>
                        ) : listings.length === 0 ? (
                            <EmptyState
                                icon="search"
                                title="No homes match these filters"
                                description="Try widening your budget, removing a filter, or searching a nearby locality."
                                action={
                                    <button type="button" onClick={resetFilters} className="btn-brand btn-md">
                                        Clear all filters
                                    </button>
                                }
                            />
                        ) : layout === 'map' ? (
                            <div className="flex h-[70vh] gap-5">
                                <div className="w-full space-y-3 overflow-y-auto pr-1 scrollbar-slim lg:w-[45%]">
                                    {listings.map((property) => (
                                        <div
                                            key={property.id}
                                            onMouseEnter={() => setHoveredId(property.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                        >
                                            <PropertyCard property={property} layout="compact" />
                                        </div>
                                    ))}
                                </div>
                                <div className="hidden flex-1 lg:block">
                                    <Suspense
                                        fallback={
                                            <div className="flex h-full items-center justify-center rounded-2xl border border-ink-200 dark:border-ink-800">
                                                <Spinner className="h-6 w-6 text-brand-500" />
                                            </div>
                                        }
                                    >
                                        <PropertyMap
                                            properties={listings}
                                            activeId={hoveredId}
                                            onHover={setHoveredId}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={
                                    layout === 'grid'
                                        ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3'
                                        : 'space-y-5'
                                }
                            >
                                {listings.map((property) => (
                                    <PropertyCard
                                        key={property.id}
                                        property={property}
                                        layout={layout}
                                        isFavorited={isFavorited(property.id)}
                                        onToggleFavorite={toggleFavorite}
                                    />
                                ))}
                            </div>
                        )}

                        {!loading && !error && layout !== 'map' ? (
                            <Pagination
                                page={results?.pageNo ?? 0}
                                totalPages={results?.totalPages ?? 0}
                                onChange={changePage}
                            />
                        ) : null}
                    </section>
                </div>
            </div>

            {/* Filters as a dialog on small screens, where there is no room for a rail. */}
            <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" size="sm">
                <div className="p-4">
                    {filterPanel}
                    <button
                        type="button"
                        onClick={() => setFiltersOpen(false)}
                        className="btn-brand btn-md mt-4 w-full"
                    >
                        Show results
                    </button>
                </div>
            </Modal>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* URL <-> filter state                                                        */
/* -------------------------------------------------------------------------- */

function readFilters(params) {
    return {
        keyword: params.get('keyword') ?? '',
        city: params.get('city') ?? '',
        locality: params.get('locality') ?? '',
        minRent: params.get('minRent') ?? '',
        maxRent: params.get('maxRent') ?? '',
        type: params.getAll('type'),
        bhk: params.getAll('bhk').map(Number).filter(Number.isFinite),
        furnishing: params.get('furnishing') ?? '',
        tenant: params.get('tenant') ?? '',
        availabilityDays: params.get('availabilityDays') ?? '',
        verifiedOnly: params.get('verifiedOnly') === 'true',
        negotiableOnly: params.get('negotiableOnly') === 'true',
        sortBy: params.get('sortBy') ?? 'newest',
    };
}

function writeFilters(filters) {
    const params = new URLSearchParams();
    const setIf = (key, value) => {
        if (value !== '' && value !== null && value !== undefined) params.set(key, String(value));
    };

    setIf('keyword', filters.keyword);
    setIf('city', filters.city);
    setIf('locality', filters.locality);
    setIf('minRent', filters.minRent);
    setIf('maxRent', filters.maxRent);
    setIf('furnishing', filters.furnishing);
    setIf('tenant', filters.tenant);
    setIf('availabilityDays', filters.availabilityDays);
    if (filters.sortBy && filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy);
    if (filters.verifiedOnly) params.set('verifiedOnly', 'true');
    if (filters.negotiableOnly) params.set('negotiableOnly', 'true');

    (filters.type ?? []).forEach((type) => params.append('type', type));
    (filters.bhk ?? []).forEach((bhk) => params.append('bhk', String(bhk)));

    return params;
}

/** Translates UI state into the query parameters the API expects. */
function toApiFilters(filters) {
    const apiFilters = {
        keyword: filters.keyword,
        city: filters.city,
        locality: filters.locality,
        minRent: filters.minRent,
        maxRent: filters.maxRent,
        type: filters.type,
        bhk: filters.bhk,
        furnishing: filters.furnishing,
        tenant: filters.tenant,
        verifiedOnly: filters.verifiedOnly,
        negotiableOnly: filters.negotiableOnly,
        sortBy: filters.sortBy,
    };

    // "Available within N days" is a date on the wire.
    if (filters.availabilityDays !== '') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + Number(filters.availabilityDays));
        apiFilters.availableBy = cutoff.toISOString().slice(0, 10);
    }

    return apiFilters;
}

function countActiveFilters(filters) {
    let count = 0;
    if (filters.locality) count += 1;
    if (filters.minRent || filters.maxRent) count += 1;
    if (filters.bhk.length) count += 1;
    if (filters.furnishing) count += 1;
    if (filters.tenant) count += 1;
    if (filters.availabilityDays) count += 1;
    if (filters.verifiedOnly) count += 1;
    if (filters.negotiableOnly) count += 1;
    return count;
}
