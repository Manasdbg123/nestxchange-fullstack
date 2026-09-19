import { useCallback, useMemo, useState } from 'react';
import { listingApi } from '../api/endpoints';
import { useAuth, useToast } from '../context/contexts';
import { toErrorMessage } from '../api/client';
import useAsync from './useAsync';

const EMPTY = Object.freeze([]);

/**
 * Shortlist state for the generic Listing engine - the same optimistic-update
 * shape as {@code useFavorites} (the legacy Property-only hook), so every
 * heart button in the app behaves identically regardless of which model the
 * listing underneath belongs to.
 */
export default function useListingFavorites() {
    const { isAuthenticated, requireAuth } = useAuth();
    const toast = useToast();

    const fetcher = useCallback(
        () => (isAuthenticated ? listingApi.favorites() : Promise.resolve(EMPTY)),
        [isAuthenticated],
    );

    const { data, mutate } = useAsync(`listing-favorites:${isAuthenticated}`, fetcher);

    const [pendingChanges, setPendingChanges] = useState({});

    const favoriteIds = useMemo(() => {
        const ids = new Set((data ?? EMPTY).map((listing) => listing.id));
        Object.entries(pendingChanges).forEach(([id, favorited]) => {
            if (favorited) ids.add(Number(id));
            else ids.delete(Number(id));
        });
        return ids;
    }, [data, pendingChanges]);

    const toggleFavorite = useCallback(
        async (listingId) => {
            if (!isAuthenticated) {
                requireAuth({ reason: 'Sign in to save listings to your shortlist' });
                return;
            }

            const wasFavorited = favoriteIds.has(listingId);
            setPendingChanges((current) => ({ ...current, [listingId]: !wasFavorited }));

            try {
                const nowFavorited = await listingApi.toggleFavorite(listingId);
                setPendingChanges((current) => ({ ...current, [listingId]: nowFavorited }));
                if (!nowFavorited) {
                    mutate((items) => (items ?? EMPTY).filter((item) => item.id !== listingId));
                }
            } catch (error) {
                setPendingChanges((current) => ({ ...current, [listingId]: wasFavorited }));
                toast.error(toErrorMessage(error, 'Could not update your shortlist.'));
            }
        },
        [isAuthenticated, requireAuth, favoriteIds, mutate, toast],
    );

    return {
        favoriteIds,
        isFavorited: useCallback((id) => favoriteIds.has(id), [favoriteIds]),
        toggleFavorite,
        count: favoriteIds.size,
    };
}
