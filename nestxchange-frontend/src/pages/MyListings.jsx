import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import Icon from '../components/ui/Icon';
import { Alert, Badge, EmptyState, Spinner } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import useAsync from '../hooks/useAsync';
import { useToast } from '../context/contexts';
import { listingApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';
import { formatCurrency, formatRelative, humanise } from '../lib/format';
import { LISTING_CATEGORIES, LISTING_STATUS_BADGES } from '../lib/constants';

/**
 * "My Listings" for the generic engine - the equivalent of the legacy
 * MyProperties page, but covering both categories since a Listing here can
 * be either. Property listings posted through the older /post-property flow
 * (with photos) still only show up on /my-properties; the two models don't
 * share a table yet (see the backend README's "Known limitations").
 */
export default function MyListings() {
    usePageMeta({ title: 'My listings' });
    const toast = useToast();

    const fetchMine = useCallback(() => listingApi.mine(), []);
    const { data: listings, loading, error: fetchError, mutate } = useAsync('my-listings', fetchMine);

    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const error = fetchError ? toErrorMessage(fetchError, 'We could not load your listings.') : '';

    const confirmDelete = (id) => {
        setDeletingId(id);
        listingApi
            .remove(id)
            .then(() => {
                mutate((current) => (current ?? []).filter((entry) => entry.id !== id));
                toast.success('Listing deleted.');
            })
            .catch((requestError) => toast.error(toErrorMessage(requestError, 'Could not delete that listing.')))
            .finally(() => {
                setDeletingId(null);
                setPendingDeleteId(null);
            });
    };

    return (
        <div className="bg-ink-50 py-10 dark:bg-ink-950">
            <div className="container-page">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-extrabold text-ink-900 dark:text-ink-50">
                            My listings
                        </h1>
                        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                            Everything you've posted, property and vehicles together.
                        </p>
                    </div>
                    <Link to="/create-listing" className="btn-brand btn-md">
                        <Icon name="plus" className="h-4 w-4" strokeWidth={2.5} />
                        Post a listing
                    </Link>
                </div>

                {error ? (
                    <Alert tone="error">{error}</Alert>
                ) : loading ? (
                    <div className="flex justify-center py-16">
                        <Spinner className="h-8 w-8 text-brand-500" />
                    </div>
                ) : !listings || listings.length === 0 ? (
                    <EmptyState
                        icon="tag"
                        title="You haven't posted anything yet"
                        description="List a property or a vehicle - it takes a couple of minutes."
                        action={
                            <Link to="/create-listing" className="btn-brand btn-md">
                                Post your first listing
                            </Link>
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {listings.map((listing) => {
                            const categoryEntry = LISTING_CATEGORIES.find((entry) => entry.value === listing.category);
                            const statusBadge = LISTING_STATUS_BADGES[listing.status];

                            return (
                                <div key={listing.id} className="surface flex flex-wrap items-center gap-4 p-4">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                                        <Icon name={categoryEntry?.icon ?? 'tag'} className="h-5 w-5" strokeWidth={2} />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <Link
                                            to={`/listings/${listing.id}`}
                                            className="truncate font-display text-base font-bold text-ink-900 hover:text-brand-600 dark:text-ink-50 dark:hover:text-brand-300"
                                        >
                                            {listing.title}
                                        </Link>
                                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
                                            <span>{humanise(listing.category)} · {humanise(listing.mode)}</span>
                                            <span>{listing.location}</span>
                                            <span>Posted {formatRelative(listing.createdAt)}</span>
                                        </p>
                                    </div>

                                    <p className="shrink-0 font-display text-sm font-bold text-brand-600 dark:text-brand-300">
                                        {formatCurrency(listing.price)}
                                    </p>

                                    {statusBadge ? (
                                        <div className="shrink-0">
                                            <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
                                        </div>
                                    ) : null}

                                    <div className="flex shrink-0 items-center gap-2">
                                        <Link to={`/my-listings/${listing.id}/edit`} className="btn-secondary btn-sm">
                                            <Icon name="edit" className="h-3.5 w-3.5" />
                                            Edit
                                        </Link>
                                        {pendingDeleteId === listing.id ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => confirmDelete(listing.id)}
                                                    disabled={deletingId === listing.id}
                                                    className="btn-sm inline-flex items-center gap-1.5 rounded-xl bg-accent-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-accent-600"
                                                >
                                                    {deletingId === listing.id ? 'Deleting…' : 'Confirm delete'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingDeleteId(null)}
                                                    className="btn-ghost btn-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setPendingDeleteId(listing.id)}
                                                className="btn-ghost btn-sm text-accent-600 hover:bg-accent-50 dark:text-accent-400 dark:hover:bg-accent-950/30"
                                            >
                                                <Icon name="trash" className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
