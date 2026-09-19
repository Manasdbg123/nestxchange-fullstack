import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ListingForm from '../components/listings/ListingForm';
import { Alert, Spinner } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import { useToast } from '../context/contexts';
import { listingApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';
import { LISTING_CATEGORIES, LISTING_MODES } from '../lib/constants';

/**
 * The one "post a listing" page for every category and mode. What fields it
 * asks for comes from the category's schema (see ListingForm); this page's
 * only job is picking which category/mode the listing belongs to and wiring
 * the submit to POST /listings.
 */
export default function CreateListing() {
    usePageMeta({ title: 'Post a listing' });

    const navigate = useNavigate();
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const category = searchParams.get('category') ?? 'PROPERTY';
    const mode = searchParams.get('mode') ?? 'SELL';

    const [schemas, setSchemas] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        let cancelled = false;
        listingApi
            .schemas()
            .then((result) => !cancelled && setSchemas(result))
            .catch((error) => !cancelled && setLoadError(toErrorMessage(error, 'Could not load listing fields.')));
        return () => {
            cancelled = true;
        };
    }, []);

    const schema = schemas?.find((entry) => entry.category === category);

    const handleSubmit = async (payload) => {
        setSubmitting(true);
        setSubmitError('');
        try {
            const created = await listingApi.create({ category, mode, ...payload });
            toast.success('Your listing is live.');
            navigate(`/listings/${created.id}`);
        } catch (error) {
            setSubmitError(toErrorMessage(error, 'We could not publish your listing.'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-ink-50 py-10 dark:bg-ink-950">
            <div className="container-page max-w-3xl">
                <h1 className="mb-2 font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                    Post a listing
                </h1>
                <p className="mb-6 text-sm text-ink-500 dark:text-ink-400">
                    Choose a category and what you're doing, then fill in the details.
                </p>

                <div className="surface mb-6 flex flex-wrap gap-6 p-5">
                    <PickerGroup
                        label="Category"
                        options={LISTING_CATEGORIES}
                        value={category}
                        onChange={(next) => setSearchParams({ category: next, mode })}
                    />
                    <PickerGroup
                        label="Mode"
                        options={LISTING_MODES}
                        value={mode}
                        onChange={(next) => setSearchParams({ category, mode: next })}
                    />
                </div>

                {loadError ? (
                    <Alert tone="error">{loadError}</Alert>
                ) : !schemas ? (
                    <div className="flex justify-center py-16">
                        <Spinner className="h-8 w-8 text-brand-500" />
                    </div>
                ) : (
                    <div className="surface p-6">
                        <ListingForm
                            key={category}
                            schema={schema}
                            category={category}
                            mode={mode}
                            onSubmit={handleSubmit}
                            submitting={submitting}
                            error={submitError}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function PickerGroup({ label, options, value, onChange }) {
    return (
        <div>
            <p className="label mb-2">{label}</p>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        aria-pressed={value === option.value}
                        className={`chip ${value === option.value ? 'chip-active' : ''}`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
