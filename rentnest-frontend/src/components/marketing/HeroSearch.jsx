import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Icon from '../ui/Icon';
import { PROPERTY_CATEGORIES } from '../../lib/constants';

/**
 * The home page search box.
 *
 * Tabs choose which slice of the catalogue to search, mirroring how every
 * property marketplace opens. Submitting builds a real URL, so the resulting
 * search is shareable and survives a refresh.
 */
export default function HeroSearch({ suggestedCities = [] }) {
    const navigate = useNavigate();
    const [category, setCategory] = useState('all');
    const [keyword, setKeyword] = useState('');

    const submit = (event) => {
        event.preventDefault();

        const params = new URLSearchParams();
        if (keyword.trim()) params.set('keyword', keyword.trim());

        const types = PROPERTY_CATEGORIES.find((entry) => entry.id === category)?.types ?? [];
        types.forEach((type) => params.append('type', type));

        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className="w-full max-w-3xl">
            <div
                role="tablist"
                aria-label="What are you looking for?"
                className="mb-3 flex gap-1 overflow-x-auto hide-scrollbar"
            >
                {PROPERTY_CATEGORIES.map((entry) => (
                    <button
                        key={entry.id}
                        type="button"
                        role="tab"
                        aria-selected={category === entry.id}
                        onClick={() => setCategory(entry.id)}
                        className={`shrink-0 rounded-t-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                            category === entry.id
                                ? 'bg-white text-ink-900 dark:bg-ink-900 dark:text-ink-50'
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {entry.shortLabel ?? entry.label}
                    </button>
                ))}
            </div>

            <form
                onSubmit={submit}
                className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-lift sm:flex-row sm:items-center sm:rounded-full dark:bg-ink-900"
            >
                <label htmlFor="hero-search" className="sr-only">
                    Search by city or locality
                </label>
                <div className="flex flex-1 items-center gap-2.5 px-4 py-2">
                    <Icon name="search" className="h-5 w-5 shrink-0 text-ink-400" />
                    <input
                        id="hero-search"
                        type="search"
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="Search by city or locality, e.g. Koramangala"
                        className="w-full bg-transparent text-sm font-medium text-ink-900 outline-none placeholder:text-ink-400 dark:text-ink-50"
                    />
                </div>
                <button type="submit" className="btn-primary btn-md shrink-0 sm:rounded-full sm:px-8">
                    Search
                </button>
            </form>

            {suggestedCities.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-white/70">Popular:</span>
                    {suggestedCities.slice(0, 5).map((city) => (
                        <button
                            key={city}
                            type="button"
                            onClick={() => navigate(`/search?city=${encodeURIComponent(city)}`)}
                            className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/15"
                        >
                            {city}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
