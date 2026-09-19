import { useEffect, useRef, useState } from 'react';

import Icon from '../ui/Icon';
import { Alert, Field, Spinner } from '../ui/Primitives';
import {
    AMENITY_OPTIONS,
    FURNISHING_OPTIONS,
    PROPERTY_TYPES,
    TENANT_OPTIONS,
} from '../../lib/constants';
import { formatCurrency } from '../../lib/format';
import { EMPTY_PROPERTY } from '../../lib/propertyDefaults';

const MAX_IMAGES = 12;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Shared by the post and edit flows.
 *
 * The original form had a few gaps worth naming: it offered only four of the
 * eight property types (no rooms, PGs, shops or commercial), had no way to
 * record amenities or mark the rent negotiable even though both are displayed
 * on the listing card, refused to submit without at least one image, and
 * validated nothing before hitting the server.
 */
export default function PropertyForm({
    initialValues = EMPTY_PROPERTY,
    onSubmit,
    submitLabel = 'Publish listing',
    showImageUpload = true,
    showStatus = false,
    busy = false,
    error = '',
    fieldErrors = {},
}) {
    const [values, setValues] = useState(initialValues);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [imageError, setImageError] = useState('');
    const [localErrors, setLocalErrors] = useState({});
    const fileInputRef = useRef(null);

    // `initialValues` is only ever supplied once - the edit page waits for the
    // listing to load before mounting this form - so seeding state is enough
    // and no props-to-state sync effect is needed.

    // Object URLs leak until revoked. Revoking on every `previews` change would
    // invalidate URLs that are still on screen, so the live set is tracked in a
    // ref and released once, on unmount.
    const objectUrls = useRef(new Set());
    useEffect(() => {
        const urls = objectUrls.current;
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    const set = (key) => (event) => {
        const value =
            event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setValues((current) => ({ ...current, [key]: value }));
        setLocalErrors((current) => ({ ...current, [key]: undefined }));
    };

    const toggleAmenity = (amenity) => {
        setValues((current) => ({
            ...current,
            amenities: current.amenities.includes(amenity)
                ? current.amenities.filter((entry) => entry !== amenity)
                : [...current.amenities, amenity],
        }));
    };

    const addFiles = (incoming) => {
        setImageError('');

        const accepted = [];
        for (const file of incoming) {
            if (!file.type.startsWith('image/')) {
                setImageError('Only image files can be uploaded.');
                continue;
            }
            if (file.size > MAX_IMAGE_BYTES) {
                setImageError(`"${file.name}" is larger than 5 MB and was skipped.`);
                continue;
            }
            accepted.push(file);
        }

        const room = MAX_IMAGES - images.length;
        if (accepted.length > room) {
            setImageError(`You can upload up to ${MAX_IMAGES} photos per listing.`);
        }

        const kept = accepted.slice(0, Math.max(room, 0));
        if (kept.length === 0) return;

        const urls = kept.map((file) => URL.createObjectURL(file));
        urls.forEach((url) => objectUrls.current.add(url));

        setImages((current) => [...current, ...kept]);
        setPreviews((current) => [...current, ...urls]);
    };

    const removeImage = (index) => {
        objectUrls.current.delete(previews[index]);
        URL.revokeObjectURL(previews[index]);
        setImages((current) => current.filter((_, position) => position !== index));
        setPreviews((current) => current.filter((_, position) => position !== index));
    };

    /** Mirrors the server rules so problems surface before a round trip. */
    const validate = () => {
        const errors = {};
        const rent = Number(values.rentAmount);

        if (values.title.trim().length < 10) errors.title = 'Use at least 10 characters.';
        if (values.description.trim().length < 30)
            errors.description = 'Describe the property in at least 30 characters.';
        if (!Number.isFinite(rent) || rent < 1000)
            errors.rentAmount = 'Rent must be at least ₹1,000.';
        else if (rent % 100 !== 0) errors.rentAmount = 'Rent must be a round multiple of ₹100.';
        if (Number(values.depositAmount) < 0) errors.depositAmount = 'Deposit cannot be negative.';
        if (Number(values.squareFootage) < 50) errors.squareFootage = 'Enter the area in square feet.';
        if (!values.city.trim()) errors.city = 'Enter the city.';
        if (!values.locality.trim()) errors.locality = 'Enter the locality.';
        if (!/^(\+?91)?[6-9]\d{9}$/.test(values.contactNumber.replace(/\s/g, '')))
            errors.contactNumber = 'Enter a valid 10-digit Indian mobile number.';
        if (!values.availableFrom) errors.availableFrom = 'Choose when the property is available.';

        setLocalErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!validate()) {
            document.querySelector('[aria-invalid="true"]')?.focus();
            return;
        }
        onSubmit(values, images);
    };

    const errorFor = (key) => localErrors[key] ?? fieldErrors[key];

    return (
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {error ? <Alert tone="error">{error}</Alert> : null}

            {/* --------------------------------------------------- Basics */}
            <FormSection
                title="Property details"
                description="What are you listing, and where is it?"
            >
                <Field
                    label="Listing title"
                    required
                    placeholder="e.g. Bright 2 BHK apartment near Koramangala 5th Block"
                    value={values.title}
                    onChange={set('title')}
                    error={errorFor('title')}
                    hint="A clear title with the configuration and locality gets far more clicks."
                    className="sm:col-span-2"
                />

                <Field
                    label="Property type"
                    as="select"
                    required
                    value={values.type}
                    onChange={set('type')}
                    error={errorFor('type')}
                >
                    {PROPERTY_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Field>

                <Field
                    label="Bedrooms (BHK)"
                    type="number"
                    min="0"
                    max="20"
                    value={values.rooms}
                    onChange={set('rooms')}
                    error={errorFor('rooms')}
                    hint="Use 0 for shops, offices and studios."
                />

                <Field
                    label="City"
                    required
                    placeholder="Bengaluru"
                    autoComplete="address-level2"
                    value={values.city}
                    onChange={set('city')}
                    error={errorFor('city')}
                />

                <Field
                    label="Locality"
                    required
                    placeholder="Koramangala"
                    value={values.locality}
                    onChange={set('locality')}
                    error={errorFor('locality')}
                />

                <Field
                    label="Built-up area (sq.ft)"
                    type="number"
                    min="50"
                    required
                    placeholder="1200"
                    value={values.squareFootage}
                    onChange={set('squareFootage')}
                    error={errorFor('squareFootage')}
                />

                <Field
                    label="Furnishing"
                    as="select"
                    value={values.furnishingStatus}
                    onChange={set('furnishingStatus')}
                    error={errorFor('furnishingStatus')}
                >
                    {FURNISHING_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Field>
            </FormSection>

            {/* --------------------------------------------------- Pricing */}
            <FormSection title="Rent and deposit" description="What are you asking for?">
                <Field
                    label="Monthly rent (₹)"
                    type="number"
                    min="1000"
                    step="100"
                    required
                    placeholder="25000"
                    value={values.rentAmount}
                    onChange={set('rentAmount')}
                    error={errorFor('rentAmount')}
                    hint={
                        Number(values.rentAmount) > 0
                            ? `Tenants will see ${formatCurrency(values.rentAmount)} per month.`
                            : 'Must be a multiple of ₹100.'
                    }
                />

                <Field
                    label="Security deposit (₹)"
                    type="number"
                    min="0"
                    step="1000"
                    required
                    placeholder="100000"
                    value={values.depositAmount}
                    onChange={set('depositAmount')}
                    error={errorFor('depositAmount')}
                />

                <Field
                    label="Available from"
                    type="date"
                    required
                    value={values.availableFrom}
                    onChange={set('availableFrom')}
                    error={errorFor('availableFrom')}
                />

                <Field
                    label="Preferred tenants"
                    as="select"
                    value={values.tenantPreference}
                    onChange={set('tenantPreference')}
                >
                    {TENANT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Field>

                <label className="flex items-center gap-3 sm:col-span-2">
                    <input
                        type="checkbox"
                        checked={values.negotiable}
                        onChange={set('negotiable')}
                        className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500 dark:border-ink-600 dark:bg-ink-800"
                    />
                    <span className="text-sm text-ink-700 dark:text-ink-200">
                        Rent is negotiable
                        <span className="ml-2 text-xs text-ink-500 dark:text-ink-400">
                            Shows a "Negotiable" badge on your listing.
                        </span>
                    </span>
                </label>

                {showStatus ? (
                    <Field
                        label="Listing status"
                        as="select"
                        value={values.status ?? 'AVAILABLE'}
                        onChange={set('status')}
                        hint="Rented and paused listings stay in your dashboard but disappear from search."
                        className="sm:col-span-2"
                    >
                        <option value="AVAILABLE">Live — accepting enquiries</option>
                        <option value="RENTED">Rented out</option>
                        <option value="INACTIVE">Paused</option>
                    </Field>
                ) : null}
            </FormSection>

            {/* -------------------------------------------------- Amenities */}
            <FormSection
                title="Amenities"
                description="Tick everything the property or building offers."
                columns={1}
            >
                <div className="flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map((amenity) => {
                        const active = values.amenities.includes(amenity);
                        return (
                            <button
                                key={amenity}
                                type="button"
                                onClick={() => toggleAmenity(amenity)}
                                aria-pressed={active}
                                className={`chip ${active ? 'chip-active' : ''}`}
                            >
                                {active ? <Icon name="check" className="h-3 w-3" strokeWidth={3} /> : null}
                                {amenity}
                            </button>
                        );
                    })}
                </div>
            </FormSection>

            {/* ------------------------------------------------- Description */}
            <FormSection title="Description and contact" columns={1}>
                <Field
                    label="Describe the property"
                    as="textarea"
                    rows={5}
                    required
                    placeholder="Mention the layout, natural light, water supply, nearby landmarks, and anything a tenant would want to know before visiting."
                    value={values.description}
                    onChange={set('description')}
                    error={errorFor('description')}
                    hint={`${values.description.length} characters — at least 30 required.`}
                />

                <Field
                    label="Contact number"
                    type="tel"
                    inputMode="numeric"
                    required
                    placeholder="9876543210"
                    autoComplete="tel"
                    value={values.contactNumber}
                    onChange={set('contactNumber')}
                    error={errorFor('contactNumber')}
                    hint="Shown only to signed-in tenants who open your listing."
                />
            </FormSection>

            {/* ----------------------------------------------------- Photos */}
            {showImageUpload ? (
                <FormSection
                    title="Photos"
                    description={`Listings with photos get far more enquiries. Up to ${MAX_IMAGES}, 5 MB each.`}
                    columns={1}
                >
                    {imageError ? <Alert tone="error" onDismiss={() => setImageError('')}>{imageError}</Alert> : null}

                    <div
                        onDragOver={(event) => {
                            event.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(event) => {
                            event.preventDefault();
                            setDragging(false);
                            addFiles(Array.from(event.dataTransfer.files ?? []));
                        }}
                        className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                            dragging
                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                : 'border-ink-300 bg-ink-50 dark:border-ink-700 dark:bg-ink-800/40'
                        }`}
                    >
                        <Icon
                            name="upload"
                            className={`mx-auto mb-3 h-10 w-10 ${dragging ? 'text-brand-500' : 'text-ink-400'}`}
                            strokeWidth={1.5}
                        />
                        <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                            Drag photos here
                        </p>
                        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">or</p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary btn-sm mt-3"
                        >
                            Choose files
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => {
                                addFiles(Array.from(event.target.files ?? []));
                                event.target.value = '';
                            }}
                        />
                    </div>

                    {previews.length > 0 ? (
                        <div>
                            <p className="mb-3 text-xs font-semibold text-ink-600 dark:text-ink-300">
                                {previews.length} of {MAX_IMAGES} selected — the first is your cover photo.
                            </p>
                            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {previews.map((preview, index) => (
                                    <li
                                        key={preview}
                                        className="group relative aspect-video overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700"
                                    >
                                        <img
                                            src={preview}
                                            alt={`Selected photo ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                        {index === 0 ? (
                                            <span className="absolute left-2 top-2 rounded bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                                Cover
                                            </span>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute right-2 top-2 rounded-full bg-ink-950/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                                        >
                                            <Icon name="close" className="h-3 w-3" strokeWidth={3} />
                                            <span className="sr-only">Remove photo {index + 1}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </FormSection>
            ) : null}

            <div className="flex justify-end gap-3 border-t border-ink-200 pt-6 dark:border-ink-800">
                <button type="submit" disabled={busy} className="btn-brand btn-lg">
                    {busy ? <Spinner className="h-4 w-4" /> : null}
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}

function FormSection({ title, description, children, columns = 2 }) {
    return (
        <section className="surface p-6">
            <header className="mb-5 border-b border-ink-100 pb-4 dark:border-ink-800">
                <h2 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">{title}</h2>
                {description ? (
                    <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>
                ) : null}
            </header>
            <div className={columns === 1 ? 'space-y-5' : 'grid gap-5 sm:grid-cols-2'}>{children}</div>
        </section>
    );
}
