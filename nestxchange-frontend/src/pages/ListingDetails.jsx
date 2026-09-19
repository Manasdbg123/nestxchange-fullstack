import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Icon from '../components/ui/Icon';
import ListingCard from '../components/listings/ListingCard';
import { Alert, Badge, EmptyState, Spinner } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import useAsync from '../hooks/useAsync';
import { useAuth, useToast } from '../context/contexts';
import { listingApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';
import { formatCurrency, formatDateTime, formatRelative, humanise } from '../lib/format';
import { LISTING_CATEGORIES, LISTING_STATUS_BADGES } from '../lib/constants';

/** Icons for the most common attribute keys across both schemas - falls back to a generic tag. */
const ATTRIBUTE_ICONS = {
    bedrooms: 'bed',
    bathrooms: 'ruler',
    sqft: 'ruler',
    propertyType: 'building',
    furnishing: 'sparkles',
    amenities: 'shield',
    make: 'car',
    model: 'car',
    year: 'calendar',
    mileage: 'ruler',
    fuelType: 'lightning',
    transmission: 'car',
};

const PLACEHOLDER_IMAGE = {
    PROPERTY: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200',
    VEHICLE: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=1200',
};

const BROWSE_ROUTE = { PROPERTY: '/properties', VEHICLE: '/vehicles' };

/**
 * A single listing, plus the controls to drive it through
 * ListingStateMachineService. This is the one place in the app that actually
 * calls POST /listings/{id}/transitions - previously the state machine was
 * only reachable by hand through the raw API.
 *
 * Which button shows is computed from `listing.status` with the same
 * AVAILABLE -> REQUESTED -> CONFIRMED -> ACTIVE/COMPLETED -> CLOSED path the
 * backend enforces; this is a UI convenience; the backend is still the
 * authority; a stale button here just gets rejected with a 409.
 */
export default function ListingDetails() {
    const { id } = useParams();
    const toast = useToast();
    const { isAuthenticated, user, requireAuth } = useAuth();

    const fetchListing = useCallback(() => listingApi.getById(id), [id]);
    const { data: listing, loading, error: fetchError, mutate } = useAsync(`listing:${id}`, fetchListing);

    const [schemas, setSchemas] = useState(null);
    useEffect(() => {
        let cancelled = false;
        listingApi.schemas().then((result) => !cancelled && setSchemas(result)).catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const [history, setHistory] = useState(null);
    const loadHistory = useCallback(() => {
        if (!isAuthenticated) return;
        listingApi
            .transitionHistory(id)
            .then(setHistory)
            .catch(() => setHistory([]));
    }, [id, isAuthenticated]);
    useEffect(loadHistory, [loadHistory]);

    const [firing, setFiring] = useState(false);
    const [transitionError, setTransitionError] = useState('');

    const [similar, setSimilar] = useState(null);
    useEffect(() => {
        if (!listing) return;
        let cancelled = false;
        listingApi
            .search({ category: listing.category }, { page: 0, size: 4 })
            .then((result) => !cancelled && setSimilar(result.content.filter((entry) => entry.id !== listing.id)))
            .catch(() => !cancelled && setSimilar([]));
        return () => {
            cancelled = true;
        };
    }, [listing]);

    const notFound = fetchError?.response?.status === 404;
    const error = fetchError && !notFound ? toErrorMessage(fetchError, 'We could not load this listing.') : '';

    usePageMeta({ title: listing?.title ?? 'Listing details' });

    const schema = schemas?.find((entry) => entry.category === listing?.category);
    const categoryEntry = LISTING_CATEGORIES.find((entry) => entry.value === listing?.category);
    const statusBadge = listing ? LISTING_STATUS_BADGES[listing.status] : null;
    const nextAction = listing ? nextActionFor(listing, user?.id) : null;

    const fireTransition = (event) => {
        const doFire = () => {
            setFiring(true);
            setTransitionError('');
            listingApi
                .fireTransition(id, event)
                .then((updated) => {
                    mutate(updated);
                    loadHistory();
                    toast.success('Listing updated.');
                })
                .catch((requestError) => {
                    setTransitionError(toErrorMessage(requestError, 'That action could not be completed.'));
                })
                .finally(() => setFiring(false));
        };

        if (!isAuthenticated) {
            requireAuth({ reason: 'Sign in to continue', onSuccess: doFire });
            return;
        }
        doFire();
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Spinner className="h-8 w-8 text-brand-500" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="container-page py-16">
                <EmptyState
                    icon="search"
                    title="Listing not found"
                    description="It may have been closed or removed by its owner."
                    action={
                        <Link to="/search" className="btn-brand btn-md">
                            Back to search
                        </Link>
                    }
                />
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="container-page py-16">
                <Alert tone="error">{error || 'Something went wrong.'}</Alert>
            </div>
        );
    }

    return (
        <div className="bg-ink-50 py-10 dark:bg-ink-950">
            <div className="container-page max-w-3xl">
                <Link to={BROWSE_ROUTE[listing.category] ?? '/search'} className="text-sm link-quiet">
                    ← Back to {categoryEntry?.label ?? 'search'}
                </Link>

                <div className="surface mt-4 overflow-hidden">
                    <div className="relative h-56 w-full overflow-hidden bg-ink-100 sm:h-72 dark:bg-ink-800">
                        <img
                            src={PLACEHOLDER_IMAGE[listing.category] ?? PLACEHOLDER_IMAGE.PROPERTY}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    </div>

                    <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="chip chip-active">
                                <Icon name={categoryEntry?.icon ?? 'tag'} className="h-3.5 w-3.5" strokeWidth={2} />
                                {humanise(listing.category)}
                            </span>
                            <span className="chip chip-active">{humanise(listing.mode)}</span>
                            {statusBadge ? <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge> : null}
                        </div>

                        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink-900 dark:text-ink-50">
                            {listing.title}
                        </h1>

                        <p className="mt-1 flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400">
                            <Icon name="pin" className="h-4 w-4" />
                            {listing.location}
                        </p>

                        <p className="mt-4 text-2xl font-extrabold text-brand-600 dark:text-brand-300">
                            {formatCurrency(listing.price)}
                            {listing.mode === 'RENT' ? (
                                <span className="text-sm font-medium text-ink-400">/mo</span>
                            ) : null}
                        </p>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-700 dark:text-ink-300">
                            {listing.description}
                        </p>

                        {schema && Object.keys(listing.attributes ?? {}).length > 0 ? (
                            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-ink-100 pt-6 dark:border-ink-800 sm:grid-cols-3">
                                {schema.fields
                                    .filter((field) => listing.attributes[field.key] !== undefined)
                                    .map((field) => (
                                        <div
                                            key={field.key}
                                            className="flex items-start gap-2.5 rounded-xl bg-ink-50 p-3 dark:bg-ink-800/60"
                                        >
                                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                                                <Icon
                                                    name={ATTRIBUTE_ICONS[field.key] ?? 'tag'}
                                                    className="h-3.5 w-3.5"
                                                    strokeWidth={2}
                                                />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                                                    {field.label}
                                                </p>
                                                <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                                                    {formatAttributeValue(listing.attributes[field.key])}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : null}

                        <p className="mt-6 text-xs text-ink-400">Posted {formatRelative(listing.createdAt)}</p>
                    </div>
                </div>

                {/* ----------------------------------------------- State machine */}
                <div className="surface mt-5 p-6">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                        Status
                    </h2>

                    {transitionError ? (
                        <div className="mt-3">
                            <Alert tone="error" onDismiss={() => setTransitionError('')}>
                                {transitionError}
                            </Alert>
                        </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className="text-sm text-ink-600 dark:text-ink-300">
                            Currently <strong>{statusBadge?.label ?? listing.status}</strong>
                        </span>
                        {!nextAction ? (
                            <span className="text-sm text-ink-400">This listing has run its full lifecycle.</span>
                        ) : nextAction.allowed ? (
                            <button
                                type="button"
                                onClick={() => fireTransition(nextAction.event)}
                                disabled={firing}
                                className="btn-brand btn-sm"
                            >
                                {firing ? 'Working…' : nextAction.label}
                            </button>
                        ) : (
                            <span className="text-sm text-ink-400">{nextAction.deniedReason}</span>
                        )}
                    </div>

                    {!isAuthenticated ? (
                        <p className="mt-2 text-xs text-ink-400">Sign in to interact with this listing.</p>
                    ) : null}
                </div>

                {/* -------------------------------------------------------- History */}
                {isAuthenticated && history && history.length > 0 ? (
                    <div className="surface mt-5 p-6">
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                            History
                        </h2>
                        <ol className="space-y-3">
                            {history.map((entry) => (
                                <li key={entry.id} className="flex items-start gap-3 text-sm">
                                    <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                                    <div>
                                        <p className="font-medium text-ink-800 dark:text-ink-100">
                                            {humanise(entry.fromStatus)} → {humanise(entry.toStatus)}
                                            <span className="ml-2 text-xs font-normal text-ink-400">
                                                {entry.note}
                                            </span>
                                        </p>
                                        <p className="text-xs text-ink-400">{formatDateTime(entry.performedAt)}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                ) : null}

                {/* --------------------------------------------------- Similar */}
                {similar && similar.length > 0 ? (
                    <div className="mt-8">
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                            Similar listings
                        </h2>
                        <div className="grid gap-5 sm:grid-cols-2">
                            {similar.slice(0, 4).map((entry) => (
                                <ListingCard key={entry.id} listing={entry} />
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

/**
 * Mirrors ListingStateMachineService's transition table AND its authorization
 * rules, so a bystander sees a disabled/explained state instead of a button
 * that just 403s. Unauthenticated visitors always see `allowed: true` -
 * their identity is unknown, so the click goes through the sign-in prompt
 * (fireTransition) and the backend is still the real authority either way.
 */
function nextActionFor(listing, currentUserId) {
    const isRent = listing.mode === 'RENT';
    const isKnownUser = currentUserId != null;
    const isOwner = isKnownUser && currentUserId === listing.ownerId;
    const isRequester = isKnownUser && listing.requestedBy != null && currentUserId === listing.requestedBy;

    switch (listing.status) {
        case 'AVAILABLE':
            return {
                event: 'REQUEST',
                label: isRent ? 'Request to rent' : 'Request to buy',
                allowed: !isKnownUser || !isOwner,
                deniedReason: 'You cannot request your own listing.',
            };
        case 'REQUESTED':
            return {
                event: 'CONFIRM',
                label: 'Confirm request',
                allowed: !isKnownUser || isOwner,
                deniedReason: 'Only the owner can confirm this request.',
            };
        case 'CONFIRMED':
            return {
                event: 'PROCEED',
                label: isRent ? 'Start rental' : 'Confirm payment',
                allowed: !isKnownUser || isOwner || isRequester,
                deniedReason: 'Only the owner or the requester can do that.',
            };
        case 'ACTIVE':
        case 'COMPLETED':
            return {
                event: 'CLOSE',
                label: isRent ? 'Complete return' : 'Complete ownership transfer',
                allowed: !isKnownUser || isOwner || isRequester,
                deniedReason: 'Only the owner or the requester can do that.',
            };
        default:
            return null;
    }
}

function formatAttributeValue(value) {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
}
