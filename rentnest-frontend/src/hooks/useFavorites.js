import { useCallback, useMemo, useState } from 'react';
import { propertyApi } from '../api/endpoints';
import { useAuth, useToast } from '../context/contexts';
import { toErrorMessage } from '../api/client';
import useAsync from './useAsync';

const EMPTY = Object.freeze([]);

/**
 * Shortlist state, shared by every surface that shows a heart button.
 *
 * Toggling updates local state first so the heart responds immediately, then
 * reverts if the server disagrees - the previous implementation waited for the
 * round trip, which felt broken on a slow connection.
 */
export default function useFavorites() {
    const { isAuthenticated, requireAuth } = useAuth();
    const toast = useToast();

    // Signed-out visitors have no shortlist to fetch, so resolve immediately
    // rather than firing a request that is certain to 401.
    const fetcher = useCallback(
        () => (isAuthenticated ? propertyApi.favorites() : Promise.resolve(EMPTY)),
        [isAuthenticated],
    );

    const { data, mutate } = useAsync(`favorites:${isAuthenticated}`, fetcher);

    // Overrides applied optimistically on top of whatever the server last told us.
    const [pendingChanges, setPendingChanges] = useState({});

    const favoriteIds = useMemo(() => {
        const ids = new Set((data ?? EMPTY).map((property) => property.id));
        Object.entries(pendingChanges).forEach(([id, favorited]) => {
            if (favorited) ids.add(Number(id));
            else ids.delete(Number(id));
        });
        return ids;
    }, [data, pendingChanges]);

    const toggleFavorite = useCallback(
        async (propertyId) => {
            if (!isAuthenticated) {
                requireAuth({ reason: 'Sign in to save properties to your shortlist' });
                return;
            }

            const wasFavorited = favoriteIds.has(propertyId);
            setPendingChanges((current) => ({ ...current, [propertyId]: !wasFavorited }));

            try {
                const nowFavorited = await propertyApi.toggleFavorite(propertyId);
                setPendingChanges((current) => ({ ...current, [propertyId]: nowFavorited }));
                if (!nowFavorited) {
                    mutate((items) => (items ?? EMPTY).filter((item) => item.id !== propertyId));
                }
            } catch (error) {
                // Put it back the way it was so the heart matches reality.
                setPendingChanges((current) => ({ ...current, [propertyId]: wasFavorited }));
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
