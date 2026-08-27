import Icon from '../ui/Icon';
import { Field } from '../ui/Primitives';
import {
    AVAILABILITY_OPTIONS,
    BHK_OPTIONS,
    FURNISHING_OPTIONS,
    SORT_OPTIONS,
    TENANT_OPTIONS,
} from '../../lib/constants';

/**
 * The filter sidebar.
 *
 * Every control here maps to a query parameter the API understands. In the
 * previous build, BHK, availability, verified-only and property type were
 * applied in the browser after the fact, so the "N properties found" count and
 * the pagination described a different result set than the one on screen.
 */
export default function PropertyFilters({ filters, onChange, onReset, className = '' }) {
    const set = (key, value) => onChange({ ...filters, [key]: value });

    const toggleInArray = (key, value) => {
        const current = filters[key] ?? [];
        const next = current.includes(value)
            ? current.filter((entry) => entry !== value)
            : [...current, value];
        set(key, next);
    };

    return (
        <div className={`surface overflow-hidden ${className}`}>
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800">
                <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink-900 dark:text-ink-50">
                    <Icon name="filter" className="h-4 w-4 text-brand-500" />
                    Filters
                </h2>
                <button
                    type="button"
                    onClick={onReset}
                    className="text-xs font-semibold text-accent-600 hover:underline dark:text-accent-400"
                >
                    Clear all
                </button>
            </div>

            <div className="max-h-[calc(100vh-14rem)] space-y-6 overflow-y-auto px-5 py-5 scrollbar-slim">
                <Group label="Locality">
                    <Field
                        placeholder="e.g. Koramangala"
                        value={filters.locality ?? ''}
                        onChange={(event) => set('locality', event.target.value)}
                    />
                </Group>

                <Group label="Monthly rent">
                    <div className="flex items-center gap-2">
                        <Field
                            type="number"
                            min="0"
                            step="500"
                            placeholder="Min"
                            aria-label="Minimum rent"
                            value={filters.minRent ?? ''}
                            onChange={(event) => set('minRent', event.target.value)}
                            className="flex-1"
                        />
                        <span aria-hidden="true" className="text-ink-400">
                            –
                        </span>
                        <Field
                            type="number"
                            min="0"
                            step="500"
                            placeholder="Max"
                            aria-label="Maximum rent"
                            value={filters.maxRent ?? ''}
                            onChange={(event) => set('maxRent', event.target.value)}
                            className="flex-1"
                        />
                    </div>
                </Group>

                <Group label="Bedrooms">
                    <div className="flex flex-wrap gap-2">
                        {BHK_OPTIONS.map((option) => {
                            const active = (filters.bhk ?? []).includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => toggleInArray('bhk', option.value)}
                                    aria-pressed={active}
                                    className={`chip ${active ? 'chip-active' : ''}`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </Group>

                <Group label="Furnishing">
                    <div className="flex flex-wrap gap-2">
                        {FURNISHING_OPTIONS.map((option) => {
                            const active = filters.furnishing === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => set('furnishing', active ? '' : option.value)}
                                    aria-pressed={active}
                                    className={`chip ${active ? 'chip-active' : ''}`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </Group>

                <Group label="Available within">
                    <Field
                        as="select"
                        value={filters.availabilityDays ?? ''}
                        onChange={(event) => set('availabilityDays', event.target.value)}
                    >
                        {AVAILABILITY_OPTIONS.map((option) => (
                            <option key={option.label} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Field>
                </Group>

                <Group label="Preferred tenants">
                    <Field
                        as="select"
                        value={filters.tenant ?? ''}
                        onChange={(event) => set('tenant', event.target.value)}
                    >
                        <option value="">Any</option>
                        {TENANT_OPTIONS.filter((option) => option.value !== 'ANY').map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Field>
                </Group>

                <Group label="Sort by">
                    <Field
                        as="select"
                        value={filters.sortBy ?? 'newest'}
                        onChange={(event) => set('sortBy', event.target.value)}
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Field>
                </Group>

                <div className="space-y-3 border-t border-ink-100 pt-5 dark:border-ink-800">
                    <Checkbox
                        label="Verified listings only"
                        checked={Boolean(filters.verifiedOnly)}
                        onChange={(checked) => set('verifiedOnly', checked)}
                    />
                    <Checkbox
                        label="Rent is negotiable"
                        checked={Boolean(filters.negotiableOnly)}
                        onChange={(checked) => set('negotiableOnly', checked)}
                    />
                </div>
            </div>
        </div>
    );
}

function Group({ label, children }) {
    return (
        <div>
            <p className="label">{label}</p>
            {children}
        </div>
    );
}

function Checkbox({ label, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-700 dark:text-ink-200">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500 dark:border-ink-600 dark:bg-ink-800"
            />
            {label}
        </label>
    );
}
