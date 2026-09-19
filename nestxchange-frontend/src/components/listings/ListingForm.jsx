import { useState } from 'react';

import { Alert, Field } from '../ui/Primitives';
import Icon from '../ui/Icon';
import { formatCurrency } from '../../lib/format';
import { LISTING_CATEGORIES, LISTING_MODES } from '../../lib/constants';

const STEPS = ['Basics', 'Details', 'Location & price', 'Review'];

/**
 * One multi-step form component for every category. Which attribute fields
 * render in the "Details" step, with what input type and which are
 * required, comes entirely from `schema` (a CategorySchemaResponse fetched
 * from GET /listings/schemas) - there is no PropertyListingForm/
 * VehicleListingForm split, and no `if (category === 'VEHICLE')` anywhere in
 * here. Add a field to the backend's CategorySchemaRegistry and it appears
 * here with no frontend change at all.
 *
 * There is no image step: the generic Listing engine has no photo-upload
 * support yet (only the legacy Property model does, via /post-property) -
 * see the backend README's "Known limitations". Faking an upload step here
 * would submit nothing real, so it's left out rather than pretended.
 */
export default function ListingForm({ schema, category, mode, initialValues, onSubmit, submitting, error }) {
    const [step, setStep] = useState(0);
    const [touchedStep, setTouchedStep] = useState(-1);
    const [values, setValues] = useState(() => ({
        title: initialValues?.title ?? '',
        description: initialValues?.description ?? '',
        price: initialValues?.price ?? '',
        location: initialValues?.location ?? '',
        attributes: { ...initialValues?.attributes },
    }));

    const categoryLabel = LISTING_CATEGORIES.find((entry) => entry.value === category)?.label ?? category;
    const modeLabel = LISTING_MODES.find((entry) => entry.value === mode)?.label ?? mode;

    const setField = (key, value) => setValues((current) => ({ ...current, [key]: value }));
    const setAttribute = (key, value) =>
        setValues((current) => ({ ...current, attributes: { ...current.attributes, [key]: value } }));

    const stepErrors = validateStep(step, values, schema);
    const canAdvance = stepErrors.length === 0;

    const goNext = () => {
        setTouchedStep(step);
        if (validateStep(step, values, schema).length > 0) return;
        setStep((current) => Math.min(current + 1, STEPS.length - 1));
        setTouchedStep(-1);
    };

    const goBack = () => setStep((current) => Math.max(current - 1, 0));

    const handleSubmit = (event) => {
        event.preventDefault();
        if (step !== STEPS.length - 1) {
            goNext();
            return;
        }
        onSubmit({
            title: values.title,
            description: values.description,
            price: values.price === '' ? null : Number(values.price),
            location: values.location,
            attributes: coerceAttributes(schema, values.attributes),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error ? <Alert tone="error">{error}</Alert> : null}

            <StepIndicator steps={STEPS} current={step} onJump={setStep} />

            <div className="flex flex-wrap gap-2">
                <span className="chip chip-active">{categoryLabel}</span>
                <span className="chip chip-active">{modeLabel}</span>
            </div>

            {step === 0 ? (
                <div className="grid gap-5">
                    <Field
                        label="Title"
                        required
                        minLength={10}
                        maxLength={120}
                        hint="10-120 characters"
                        value={values.title}
                        onChange={(event) => setField('title', event.target.value)}
                    />
                    <Field
                        as="textarea"
                        label="Description"
                        required
                        minLength={30}
                        maxLength={4000}
                        rows={5}
                        hint="At least 30 characters - what makes this worth a look?"
                        value={values.description}
                        onChange={(event) => setField('description', event.target.value)}
                    />
                </div>
            ) : null}

            {step === 1 ? (
                <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                        {categoryLabel} details
                    </h3>
                    {schema ? (
                        <div className="grid gap-5 sm:grid-cols-2">
                            {schema.fields.map((field) => (
                                <AttributeInput
                                    key={field.key}
                                    field={field}
                                    value={values.attributes[field.key]}
                                    onChange={(value) => setAttribute(field.key, value)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-ink-500 dark:text-ink-400">Loading category fields…</p>
                    )}
                </div>
            ) : null}

            {step === 2 ? (
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                        label="Location"
                        required
                        maxLength={160}
                        value={values.location}
                        onChange={(event) => setField('location', event.target.value)}
                        className="sm:col-span-2"
                    />
                    <Field
                        label="Price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        hint={mode === 'RENT' ? 'Per month' : 'Total asking price'}
                        value={values.price}
                        onChange={(event) => setField('price', event.target.value)}
                    />
                </div>
            ) : null}

            {step === 3 ? (
                <ReviewStep
                    values={values}
                    schema={schema}
                    categoryLabel={categoryLabel}
                    modeLabel={modeLabel}
                    onEditStep={setStep}
                />
            ) : null}

            {touchedStep === step && stepErrors.length > 0 ? (
                <Alert tone="error">{stepErrors[0]}</Alert>
            ) : null}

            <div className="flex items-center justify-between border-t border-ink-100 pt-5 dark:border-ink-800">
                <button
                    type="button"
                    onClick={goBack}
                    disabled={step === 0}
                    className="btn-secondary btn-md disabled:invisible"
                >
                    <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.5} />
                    Back
                </button>

                {step === STEPS.length - 1 ? (
                    <button type="submit" disabled={submitting} className="btn-brand btn-lg">
                        {submitting ? 'Posting…' : 'Publish listing'}
                        <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                ) : (
                    <button type="submit" className="btn-brand btn-md" disabled={touchedStep === step && !canAdvance}>
                        Continue
                        <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                )}
            </div>
        </form>
    );
}

function StepIndicator({ steps, current, onJump }) {
    return (
        <ol className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {steps.map((label, index) => (
                <li key={label} className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => index < current && onJump(index)}
                        aria-current={index === current ? 'step' : undefined}
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            index === current
                                ? 'bg-brand-500 text-white'
                                : index < current
                                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
                                  : 'bg-ink-100 text-ink-400 dark:bg-ink-800'
                        }`}
                    >
                        {index < current ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                    </button>
                    <span
                        className={`text-xs font-semibold ${index === current ? 'text-ink-900 dark:text-ink-50' : 'text-ink-400'}`}
                    >
                        {label}
                    </span>
                    {index < steps.length - 1 ? <span className="h-px w-6 bg-ink-200 dark:bg-ink-700" /> : null}
                </li>
            ))}
        </ol>
    );
}

function ReviewStep({ values, schema, categoryLabel, modeLabel, onEditStep }) {
    const attributeEntries = (schema?.fields ?? [])
        .filter((field) => values.attributes[field.key] !== undefined && values.attributes[field.key] !== '')
        .map((field) => [field.label, formatAttributeForReview(values.attributes[field.key])]);

    return (
        <div className="space-y-4">
            <ReviewCard title="Basics" onEdit={() => onEditStep(0)}>
                <p className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">{values.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">{values.description}</p>
            </ReviewCard>

            <ReviewCard title={`${categoryLabel} details`} onEdit={() => onEditStep(1)}>
                {attributeEntries.length === 0 ? (
                    <p className="text-sm text-ink-400">No optional details added.</p>
                ) : (
                    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {attributeEntries.map(([label, value]) => (
                            <div key={label}>
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                                    {label}
                                </dt>
                                <dd className="text-sm font-medium text-ink-900 dark:text-ink-50">{value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </ReviewCard>

            <ReviewCard title="Location & price" onEdit={() => onEditStep(2)}>
                <p className="text-sm text-ink-700 dark:text-ink-200">{values.location}</p>
                <p className="mt-1 font-display text-xl font-extrabold text-brand-600 dark:text-brand-300">
                    {formatCurrency(values.price)}
                    {modeLabel === 'For rent' || modeLabel === 'Rent' ? (
                        <span className="text-xs font-medium text-ink-400"> /mo</span>
                    ) : null}
                </p>
            </ReviewCard>
        </div>
    );
}

function ReviewCard({ title, onEdit, children }) {
    return (
        <div className="surface p-4">
            <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">{title}</h4>
                <button type="button" onClick={onEdit} className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">
                    Edit
                </button>
            </div>
            {children}
        </div>
    );
}

function AttributeInput({ field, value, onChange }) {
    const common = {
        label: field.label,
        required: field.required,
        id: `attr-${field.key}`,
    };

    if (field.type === 'BOOLEAN') {
        return (
            <label className="flex items-center gap-2.5 text-sm font-medium text-ink-700 dark:text-ink-200">
                <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => onChange(event.target.checked)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                {field.label}
            </label>
        );
    }

    if (field.type === 'STRING_ARRAY') {
        return (
            <Field
                {...common}
                hint="Comma-separated"
                value={Array.isArray(value) ? value.join(', ') : (value ?? '')}
                onChange={(event) => onChange(event.target.value)}
                className="sm:col-span-2"
            />
        );
    }

    if (field.type === 'INTEGER' || field.type === 'DECIMAL') {
        return (
            <Field
                {...common}
                type="number"
                step={field.type === 'INTEGER' ? '1' : 'any'}
                value={value ?? ''}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    }

    return (
        <Field
            {...common}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}

function formatAttributeForReview(value) {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
}

/** Per-step required-field checks, so "Continue" can't skip past something the backend will reject anyway. */
function validateStep(step, values, schema) {
    const errors = [];

    if (step === 0) {
        if (values.title.trim().length < 10) errors.push('Title must be at least 10 characters.');
        if (values.description.trim().length < 30) errors.push('Description must be at least 30 characters.');
    }

    if (step === 1 && schema) {
        for (const field of schema.fields) {
            if (!field.required) continue;
            const value = values.attributes[field.key];
            if (value === undefined || value === null || value === '') {
                errors.push(`${field.label} is required.`);
            }
        }
    }

    if (step === 2) {
        if (!values.location.trim()) errors.push('Location is required.');
        if (!values.price || Number(values.price) <= 0) errors.push('Enter a price greater than zero.');
    }

    return errors;
}

/** Turns the form's string-typed inputs back into the JSON shapes the backend's CategorySchema expects. */
function coerceAttributes(schema, rawAttributes) {
    if (!schema) return {};
    const coerced = {};

    for (const field of schema.fields) {
        const raw = rawAttributes[field.key];
        if (raw === undefined || raw === null || raw === '') continue;

        if (field.type === 'INTEGER') {
            const parsed = Number(raw);
            if (Number.isFinite(parsed)) coerced[field.key] = Math.trunc(parsed);
        } else if (field.type === 'DECIMAL') {
            const parsed = Number(raw);
            if (Number.isFinite(parsed)) coerced[field.key] = parsed;
        } else if (field.type === 'BOOLEAN') {
            coerced[field.key] = Boolean(raw);
        } else if (field.type === 'STRING_ARRAY') {
            coerced[field.key] = String(raw)
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean);
        } else {
            coerced[field.key] = raw;
        }
    }

    return coerced;
}
