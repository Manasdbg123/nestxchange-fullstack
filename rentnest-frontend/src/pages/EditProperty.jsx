import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import PropertyForm from '../components/property/PropertyForm';
import { Alert, Spinner } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import { useToast } from '../context/contexts';
import { propertyApi } from '../api/endpoints';
import { toErrorMessage, toFieldErrors } from '../api/client';

/**
 * Edit an existing listing.
 *
 * Owners previously had no way to change anything once a listing was posted -
 * a typo in the rent meant deleting and re-creating, except delete did not
 * exist either.
 */
export default function EditProperty() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    usePageMeta({ title: 'Edit your listing' });

    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        let cancelled = false;

        propertyApi
            .getById(id)
            .then((data) => !cancelled && setProperty(data))
            .catch((requestError) => {
                if (!cancelled) {
                    setLoadError(toErrorMessage(requestError, 'We could not load this listing.'));
                }
            })
            .finally(() => !cancelled && setLoading(false));

        return () => {
            cancelled = true;
        };
    }, [id]);

    const initialValues = useMemo(() => {
        if (!property) return null;
        return {
            title: property.title ?? '',
            description: property.description ?? '',
            rentAmount: property.rentAmount ?? '',
            depositAmount: property.depositAmount ?? '',
            squareFootage: property.squareFootage ?? '',
            city: property.city ?? '',
            locality: property.locality ?? '',
            type: property.type ?? 'APARTMENT',
            furnishingStatus: property.furnishingStatus ?? 'SEMI_FURNISHED',
            rooms: property.rooms ?? 0,
            contactNumber: property.contactNumber ?? '',
            availableFrom: property.availableFrom ?? '',
            tenantPreference: property.tenantPreference ?? 'ANY',
            amenities: property.amenities ?? [],
            negotiable: Boolean(property.negotiable),
            // The API only accepts the three states an owner may choose; anything
            // else (UNDER_REVIEW) stays as it is unless moderation changes it.
            status: ['AVAILABLE', 'RENTED', 'INACTIVE'].includes(property.status)
                ? property.status
                : 'AVAILABLE',
        };
    }, [property]);

    const handleSubmit = async (values) => {
        setBusy(true);
        setError('');
        setFieldErrors({});

        try {
            await propertyApi.update(id, {
                ...values,
                rentAmount: Number(values.rentAmount),
                depositAmount: Number(values.depositAmount),
                squareFootage: Number(values.squareFootage),
                rooms: Number(values.rooms),
            });
            toast.success('Listing updated.');
            navigate(`/property/${id}`);
        } catch (requestError) {
            setFieldErrors(toFieldErrors(requestError));
            setError(toErrorMessage(requestError, 'We could not save your changes.'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center" role="status">
                <Spinner className="h-8 w-8 text-brand-500" />
                <span className="sr-only">Loading listing</span>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="container-page py-16">
                <Alert tone="error">{loadError}</Alert>
                <Link to="/my-properties" className="btn-secondary btn-md mt-5">
                    Back to my listings
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-ink-50 py-10 dark:bg-ink-950">
            <div className="container-page max-w-4xl">
                <div className="mb-8">
                    <Link to="/my-properties" className="text-sm link-quiet">
                        ← Back to my listings
                    </Link>
                    <h1 className="mt-3 font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                        Edit listing
                    </h1>
                    <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                        Changes go live immediately. Photos are managed separately and are not affected by
                        an edit.
                    </p>
                </div>

                <PropertyForm
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                    submitLabel="Save changes"
                    showImageUpload={false}
                    showStatus
                    busy={busy}
                    error={error}
                    fieldErrors={fieldErrors}
                />
            </div>
        </div>
    );
}
