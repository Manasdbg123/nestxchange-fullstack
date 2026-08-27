import { useCallback } from 'react';
import { Link } from 'react-router-dom';

import PropertyCard from '../components/property/PropertyCard';
import PropertyCardSkeleton from '../components/property/PropertyCardSkeleton';
import { Alert, EmptyState } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import useFavorites from '../hooks/useFavorites';
import useAsync from '../hooks/useAsync';
import { propertyApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';

/**
 * Saved properties.
 *
 * Previously a tab inside the search page, which meant the shortlist inherited
 * the search filters and could hide saved properties that did not match the
 * currently selected BHK or budget. It is its own page and its own URL now.
 */
export default function Shortlist() {
    usePageMeta({ title: 'Your shortlist' });

    const { isFavorited, toggleFavorite } = useFavorites();

    const fetchFavorites = useCallback(() => propertyApi.favorites(), []);
    const { data, loading, error: fetchError, mutate } = useAsync('shortlist', fetchFavorites);

    const properties = data ?? [];
    const error = fetchError ? toErrorMessage(fetchError, 'We could not load your shortlist.') : '';

    // Removing a favourite here should drop it from the list straight away
    // rather than leaving a card whose heart no longer matches its section.
    const handleToggle = async (propertyId) => {
        await toggleFavorite(propertyId);
        mutate((current) => (current ?? []).filter((entry) => entry.id !== propertyId));
    };

    return (
        <div className="bg-ink-50 py-10 dark:bg-ink-950">
            <div className="container-page max-w-5xl">
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                        Your shortlist
                    </h1>
                    <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                        {loading
                            ? 'Loading saved properties…'
                            : `${properties.length} ${
                                  properties.length === 1 ? 'property' : 'properties'
                              } saved.`}
                    </p>
                </div>

                {error ? <Alert tone="error">{error}</Alert> : null}

                {loading ? (
                    <div className="space-y-5">
                        {[0, 1].map((key) => (
                            <PropertyCardSkeleton key={key} />
                        ))}
                    </div>
                ) : properties.length === 0 ? (
                    <EmptyState
                        icon="heart"
                        title="Nothing saved yet"
                        description="Tap the heart on any listing to keep it here while you compare options."
                        action={
                            <Link to="/search" className="btn-brand btn-md">
                                Browse rentals
                            </Link>
                        }
                    />
                ) : (
                    <div className="space-y-5">
                        {properties.map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                layout="list"
                                isFavorited={isFavorited(property.id)}
                                onToggleFavorite={handleToggle}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
