import { useCallback } from 'react';
import { Link } from 'react-router-dom';

import ListingCard from '../components/listings/ListingCard';
import { Alert, EmptyState, Spinner } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import useListingFavorites from '../hooks/useListingFavorites';
import useAsync from '../hooks/useAsync';
import { listingApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';

/**
 * Saved listings for the generic engine - the equivalent of the legacy
 * Shortlist page (Property-only). Its own page/URL for the same reason:
 * shortlisted items shouldn't disappear because a search filter elsewhere
 * doesn't match them.
 */
export default function ListingFavorites() {
    usePageMeta({ title: 'Your shortlist' });

    const { isFavorited, toggleFavorite } = useListingFavorites();

    const fetchFavorites = useCallback(() => listingApi.favorites(), []);
    const { data, loading, error: fetchError, mutate } = useAsync('listing-shortlist-page', fetchFavorites);

    const listings = data ?? [];
    const error = fetchError ? toErrorMessage(fetchError, 'We could not load your shortlist.') : '';

    const handleToggle = async (listingId) => {
        await toggleFavorite(listingId);
        mutate((current) => (current ?? []).filter((entry) => entry.id !== listingId));
    };

    return (
        <div className="bg-ink-50 py-10 dark:bg-ink-950">
            <div className="container-page max-w-5xl">
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                        Your shortlist
                    </h1>
                    <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                        {loading ? 'Loading saved listings…' : `${listings.length} ${listings.length === 1 ? 'listing' : 'listings'} saved.`}
                    </p>
                </div>

                {error ? <Alert tone="error">{error}</Alert> : null}

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Spinner className="h-8 w-8 text-brand-500" />
                    </div>
                ) : listings.length === 0 ? (
                    <EmptyState
                        icon="heart"
                        title="Nothing saved yet"
                        description="Tap the heart on any listing to keep it here while you compare options."
                        action={
                            <Link to="/search" className="btn-brand btn-md">
                                Browse listings
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {listings.map((listing) => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                isFavorited={isFavorited(listing.id)}
                                onToggleFavorite={handleToggle}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
