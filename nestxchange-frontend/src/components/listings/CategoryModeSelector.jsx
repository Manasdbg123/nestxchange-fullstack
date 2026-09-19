import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Icon from '../ui/Icon';
import { LISTING_CATEGORIES, LISTING_MODES } from '../../lib/constants';

/**
 * The landing page's category + mode picker - the single entry point into
 * both the unified search page and the unified create-listing form.
 *
 * Rent/Buy go to /search?category=X&mode=Y (pre-filled filters on the
 * unified search page). Sell goes to /create-listing?category=X&mode=SELL
 * instead, because a seller is posting a listing, not searching for one.
 */
export default function CategoryModeSelector({ className = '' }) {
    const navigate = useNavigate();
    const [category, setCategory] = useState('PROPERTY');
    const [mode, setMode] = useState('RENT');

    const handleGo = () => {
        if (mode === 'SELL') {
            navigate(`/create-listing?category=${category}&mode=${mode}`);
        } else {
            navigate(`/search?category=${category}&mode=${mode}`);
        }
    };

    return (
        <div className={`surface p-5 sm:p-6 ${className}`}>
            <p className="label mb-2">What are you looking for?</p>
            <div className="grid grid-cols-2 gap-2">
                {LISTING_CATEGORIES.map((entry) => (
                    <button
                        key={entry.value}
                        type="button"
                        onClick={() => setCategory(entry.value)}
                        aria-pressed={category === entry.value}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                            category === entry.value
                                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                                : 'border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800'
                        }`}
                    >
                        <Icon name={entry.icon} className="h-4 w-4" strokeWidth={2} />
                        {entry.label}
                    </button>
                ))}
            </div>

            <p className="label mb-2 mt-5">I want to</p>
            <div className="grid grid-cols-3 gap-2">
                {LISTING_MODES.map((entry) => (
                    <button
                        key={entry.value}
                        type="button"
                        onClick={() => setMode(entry.value)}
                        aria-pressed={mode === entry.value}
                        className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                            mode === entry.value
                                ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300'
                                : 'border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800'
                        }`}
                    >
                        {entry.label}
                    </button>
                ))}
            </div>

            <button type="button" onClick={handleGo} className="btn-brand btn-lg mt-5 w-full">
                {mode === 'SELL' ? 'List it now' : 'Search now'}
                <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.5} />
            </button>
        </div>
    );
}
