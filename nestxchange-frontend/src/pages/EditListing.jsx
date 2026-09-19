import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import ListingForm from '../components/listings/ListingForm';
import { Alert, Spinner } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import useAsync from '../hooks/useAsync';
import { useAuth, useToast } from '../context/contexts';
import { listingApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';

/**
 * Editing a listing you own, reusing the same multi-step ListingForm as
 * creation - category and mode are fixed (shown, not editable: changing them
 * would invalidate the attributes against the schema), everything else can
 * change. Ownership is enforced server-side by ListingService.update; a
 * non-owner gets a 403 here, surfaced as an error rather than silently
 * letting them see the form.
 */
export default function EditListing() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();

    usePageMeta({ title: 'Edit listing' });

    const fetchListing = useCallback(() => listingApi.getById(id), [id]);
    const { data: listing, loading, error: fetchError } = useAsync(`listing:${id}`, fetchListing);

    const [schemas, setSchemas] = useState(null);
    useEffect(() => {
        let cancelled = false;
        listingApi.schemas().then((result) => !cancelled && setSchemas(result)).catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const error = fetchError ? toErrorMessage(fetchError, 'We could not load this listing.') : '';
    const notOwner = listing && user && listing.ownerId !== user.id;
    const schema = schemas?.find((entry) => entry.category === listing?.category);

    const handleSubmit = async (payload) => {
        setSubmitting(true);
        setSubmitError('');
        try {
            await listingApi.update(id, payload);
            toast.success('Listing updated.');
            navigate(`/listings/${id}`);
        } catch (requestError) {
            setSubmitError(toErrorMessage(requestError, 'We could not save your changes.'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || (listing && !schemas)) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Spinner className="h-8 w-8 text-brand-500" />
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="container-page py-16">
                <Alert tone="error">{error || 'Listing not found.'}</Alert>
            </div>
        );
    }

    if (notOwner) {
        return (
            <div className="container-page py-16">
                <Alert tone="error">You don't own this listing, so you can't edit it.</Alert>
            </div>
        );
    }

    return (
        <div className="bg-ink-50 py-10 dark:bg-ink-950">
            <div className="container-page max-w-3xl">
                <Link to="/my-listings" className="text-sm link-quiet">
                    ← Back to my listings
                </Link>

                <h1 className="mb-6 mt-3 font-display text-2xl font-extrabold text-ink-900 dark:text-ink-50">
                    Edit listing
                </h1>

                <div className="surface p-6">
                    <ListingForm
                        schema={schema}
                        category={listing.category}
                        mode={listing.mode}
                        initialValues={listing}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        error={submitError}
                    />
                </div>
            </div>
        </div>
    );
}
