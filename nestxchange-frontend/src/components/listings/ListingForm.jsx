import { useState } from 'react';

import { Alert, Field } from '../ui/Primitives';
import Icon from '../ui/Icon';
import { LISTING_CATEGORIES, LISTING_MODES } from '../../lib/constants';

/**
 * One form component for every category. Which attribute fields render, in
 * what order, with what input type and which are required comes entirely
 * from `schema` (a CategorySchemaResponse fetched from
 * GET /listings/schemas) - there is no PropertyListingForm/VehicleListingForm
 * split, and no `if (category === 'VEHICLE')` anywhere in here. Add a field
 * to the backend's CategorySchemaRegistry and it appears here with no
 * frontend change at all.
 */
export default function ListingForm({ schema, category, mode, initialValues, onSubmit, submitting, error }) {
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

    const handleSubmit = (event) => {
        event.preventDefault();
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

            <div className="flex flex-wrap gap-2">
                <span className="chip chip-active">{categoryLabel}</span>
                <span className="chip chip-active">{modeLabel}</span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <Field
                    label="Title"
                    required
                    minLength={10}
                    maxLength={120}
                    value={values.title}
                    onChange={(event) => setField('title', event.target.value)}
                    className="sm:col-span-2"
                />

                <Field
                    as="textarea"
                    label="Description"
                    required
                    minLength={30}
                    maxLength={4000}
                    rows={4}
                    value={values.description}
                    onChange={(event) => setField('description', event.target.value)}
                    className="sm:col-span-2"
                />

                <Field
                    label="Price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={values.price}
                    onChange={(event) => setField('price', event.target.value)}
                />

                <Field
                    label="Location"
                    required
                    maxLength={160}
                    value={values.location}
                    onChange={(event) => setField('location', event.target.value)}
                />
            </div>

            {schema ? (
                <div className="border-t border-ink-100 pt-6 dark:border-ink-800">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                        {categoryLabel} details
                    </h3>
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
                </div>
            ) : null}

            <button type="submit" disabled={submitting} className="btn-brand btn-lg w-full sm:w-auto">
                {submitting ? 'Posting…' : 'Post listing'}
                <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.5} />
            </button>
        </form>
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
