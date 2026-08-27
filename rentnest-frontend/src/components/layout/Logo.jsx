import { Link } from 'react-router-dom';

export default function Logo({ className = '', showWordmark = true }) {
    return (
        <Link
            to="/"
            className={`flex items-center gap-2.5 transition-opacity hover:opacity-80 ${className}`}
            aria-label="RentNest home"
        >
            <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 font-display text-xl font-extrabold text-white"
            >
                R
            </span>
            {showWordmark ? (
                <span className="font-display text-xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                    RentNest
                </span>
            ) : null}
        </Link>
    );
}
