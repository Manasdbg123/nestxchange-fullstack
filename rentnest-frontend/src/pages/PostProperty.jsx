import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import PropertyForm from '../components/property/PropertyForm';
import { EMPTY_PROPERTY } from '../lib/propertyDefaults';
import Icon from '../components/ui/Icon';
import usePageMeta from '../hooks/usePageMeta';
import { useAuth } from '../context/contexts';
import { useToast } from '../context/contexts';
import { propertyApi } from '../api/endpoints';
import { toErrorMessage, toFieldErrors } from '../api/client';

export default function PostProperty() {
    usePageMeta({ title: 'Post your property' });

    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleSubmit = async (values, images) => {
        setBusy(true);
        setError('');
        setFieldErrors({});

        try {
            const formData = new FormData();

            Object.entries(values).forEach(([key, value]) => {
                if (key === 'amenities') {
                    // Repeat the key so Spring binds it to List<String>. A single
                    // comma-joined string arrives as one amenity called "Gym,Lift".
                    value.forEach((amenity) => formData.append('amenities', amenity));
                    return;
                }
                if (value !== '' && value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });

            images.forEach((image) => formData.append('images', image));

            const created = await propertyApi.create(formData);
            toast.success('Your listing is live.');
            navigate(`/property/${created.id}`);
        } catch (requestError) {
            setFieldErrors(toFieldErrors(requestError));
            setError(toErrorMessage(requestError, 'We could not publish your listing.'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="bg-ink-50 py-10 dark:bg-ink-950">
            <div className="container-page max-w-4xl">
                <div className="mb-8">
                    <Link to="/list-your-property" className="text-sm link-quiet">
                        ← Back to owner information
                    </Link>
                    <h1 className="mt-3 font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                        Post your property
                    </h1>
                    <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                        Free to list, and it goes live as soon as you publish. You can edit anything later.
                    </p>
                </div>

                <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
                    <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                    <p>
                        Posting as <strong>{user?.name}</strong>. Your contact number is shown only to
                        signed-in tenants who open your listing.
                    </p>
                </div>

                <PropertyForm
                    initialValues={{ ...EMPTY_PROPERTY, contactNumber: user?.phone ?? '' }}
                    onSubmit={handleSubmit}
                    submitLabel="Publish listing"
                    busy={busy}
                    error={error}
                    fieldErrors={fieldErrors}
                />
            </div>
        </div>
    );
}
