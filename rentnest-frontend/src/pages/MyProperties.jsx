import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import Icon from '../components/ui/Icon';
import { Alert, Badge, EmptyState, Modal, Spinner } from '../components/ui/Primitives';
import PropertyCardSkeleton from '../components/property/PropertyCardSkeleton';
import usePageMeta from '../hooks/usePageMeta';
import useAsync from '../hooks/useAsync';
import { useToast } from '../context/contexts';
import { propertyApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';
import { LISTING_STATUS_LABELS } from '../lib/constants';
import { describeProperty, formatCurrency, formatRelative, humanise } from '../lib/format';

const STATUS_TONES = {
    AVAILABLE: 'success',
    ACTIVE: 'success',
    UNDER_REVIEW: 'warning',
    RENTED: 'info',
    INACTIVE: 'neutral',
};

/**
 * The owner's dashboard.
 *
 * The previous version listed properties and nothing else - no way to edit,
 * delete, or see how a listing was performing. It also had its own hand-rolled
 * navigation bar whose "Logout" sent the owner to a /login route that no longer
 * existed.
 */
export default function MyProperties() {
    usePageMeta({ title: 'My listings' });

    const toast = useToast();
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchMine = useCallback(() => propertyApi.mine(), []);
    const { data, loading, error: fetchError, mutate } = useAsync('my-properties', fetchMine);

    const properties = data ?? [];
    const error = fetchError ? toErrorMessage(fetchError, 'We could not load your listings.') : '';

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await propertyApi.remove(pendingDelete.id);
            mutate((current) => (current ?? []).filter((entry) => entry.id !== pendingDelete.id));
            toast.success('Listing deleted.');
            setPendingDelete(null);
        } catch (requestError) {
            toast.error(toErrorMessage(requestError, 'We could not delete that listing.'));
        } finally {
            setDeleting(false);
        }
    };

    const liveCount = properties.filter((entry) =>
        ['AVAILABLE', 'ACTIVE'].includes(entry.status),
    ).length;

    return (
        <div className="bg-ink-50 py-10 dark:bg-ink-950">
            <div className="container-page max-w-5xl">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                            My listings
                        </h1>
                        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                            {loading
                                ? 'Loading your properties…'
                                : `${properties.length} total, ${liveCount} live right now.`}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Link to="/visits" className="btn-secondary btn-md">
                            <Icon name="calendar" className="h-4 w-4" />
                            Visit requests
                        </Link>
                        <Link to="/post-property" className="btn-brand btn-md">
                            <Icon name="plus" className="h-4 w-4" strokeWidth={2.5} />
                            Post a property
                        </Link>
                    </div>
                </div>

                {error ? <Alert tone="error">{error}</Alert> : null}

                {loading ? (
                    <div className="space-y-4">
                        {[0, 1].map((key) => (
                            <PropertyCardSkeleton key={key} />
                        ))}
                    </div>
                ) : properties.length === 0 ? (
                    <EmptyState
                        icon="building"
                        title="You have not posted a property yet"
                        description="Listing is free and takes about ten minutes. Your property goes live as soon as you publish it."
                        action={
                            <Link to="/post-property" className="btn-brand btn-md">
                                Post your first property
                            </Link>
                        }
                    />
                ) : (
                    <ul className="space-y-4">
                        {properties.map((property) => (
                            <li key={property.id} className="surface overflow-hidden">
                                <div className="flex flex-col sm:flex-row">
                                    <Link
                                        to={`/property/${property.id}`}
                                        className="h-40 w-full shrink-0 overflow-hidden bg-ink-100 sm:h-auto sm:w-52 dark:bg-ink-800"
                                    >
                                        {property.images?.[0] ? (
                                            <img
                                                src={property.images[0].imageUrl}
                                                alt=""
                                                loading="lazy"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center text-xs text-ink-400">
                                                No photo
                                            </span>
                                        )}
                                    </Link>

                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="mb-2 flex flex-wrap gap-2">
                                                    <Badge tone={STATUS_TONES[property.status] ?? 'neutral'}>
                                                        {LISTING_STATUS_LABELS[property.status] ??
                                                            humanise(property.status)}
                                                    </Badge>
                                                    {property.verified ? (
                                                        <Badge tone="info" icon="shield">
                                                            Verified
                                                        </Badge>
                                                    ) : null}
                                                </div>

                                                <Link
                                                    to={`/property/${property.id}`}
                                                    className="font-display text-lg font-bold text-ink-900 hover:text-brand-600 dark:text-ink-50 dark:hover:text-brand-300"
                                                >
                                                    {describeProperty(property)}
                                                </Link>
                                                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                                                    {property.locality}, {property.city}
                                                </p>
                                            </div>

                                            <p className="font-display text-xl font-bold text-brand-600 dark:text-brand-300">
                                                {formatCurrency(property.rentAmount)}
                                            </p>
                                        </div>

                                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                                            <p className="text-xs text-ink-400">
                                                Posted {formatRelative(property.createdAt)}
                                            </p>

                                            <div className="flex gap-2">
                                                <Link
                                                    to={`/property/${property.id}/edit`}
                                                    className="btn-secondary btn-sm"
                                                >
                                                    <Icon name="edit" className="h-3.5 w-3.5" />
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingDelete(property)}
                                                    className="btn btn-sm border border-accent-200 text-accent-600 hover:bg-accent-50 dark:border-accent-900 dark:text-accent-400 dark:hover:bg-accent-950/40"
                                                >
                                                    <Icon name="trash" className="h-3.5 w-3.5" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* A real dialog rather than window.confirm, which cannot say what is
                about to be deleted or warn that it is permanent. */}
            <Modal
                open={Boolean(pendingDelete)}
                onClose={() => setPendingDelete(null)}
                title="Delete this listing?"
                size="sm"
            >
                <div className="px-6 py-6">
                    <p className="text-sm text-ink-600 dark:text-ink-300">
                        <strong className="text-ink-900 dark:text-ink-50">
                            {pendingDelete ? describeProperty(pendingDelete) : ''}
                        </strong>{' '}
                        in {pendingDelete?.locality} will be removed permanently, along with its photos and
                        visit requests. This cannot be undone.
                    </p>
                    <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
                        If the property is simply rented out, edit it and set the status to
                        “Rented out” instead — you can relist it later without re-entering anything.
                    </p>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setPendingDelete(null)}
                            className="btn-secondary btn-md"
                        >
                            Keep listing
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="btn btn-md bg-accent-500 text-white hover:bg-accent-600"
                        >
                            {deleting ? <Spinner className="h-4 w-4" /> : null}
                            Delete permanently
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
