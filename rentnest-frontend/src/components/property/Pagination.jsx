import Icon from '../ui/Icon';

/**
 * Page controls for the listings page.
 *
 * The search page tracked `page` and `totalPages` in state but never rendered
 * anything to change them, and asked the API for 50 results at a time to
 * compensate. Anything past the first 50 matches was simply unreachable.
 */
export default function Pagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null;

    const current = page + 1; // The API is zero-indexed; humans are not.
    const pages = buildPageList(current, totalPages);

    return (
        <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
            <button
                type="button"
                onClick={() => onChange(page - 1)}
                disabled={page === 0}
                className="btn-secondary btn-sm"
            >
                <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">Previous</span>
            </button>

            <ul className="flex items-center gap-1">
                {pages.map((entry, index) =>
                    entry === 'gap' ? (
                        <li
                            key={`gap-${index}`}
                            aria-hidden="true"
                            className="px-2 text-sm text-ink-400"
                        >
                            …
                        </li>
                    ) : (
                        <li key={entry}>
                            <button
                                type="button"
                                onClick={() => onChange(entry - 1)}
                                aria-current={entry === current ? 'page' : undefined}
                                className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition-colors ${
                                    entry === current
                                        ? 'bg-brand-500 text-white'
                                        : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
                                }`}
                            >
                                {entry}
                            </button>
                        </li>
                    ),
                )}
            </ul>

            <button
                type="button"
                onClick={() => onChange(page + 1)}
                disabled={current >= totalPages}
                className="btn-secondary btn-sm"
            >
                <span className="hidden sm:inline">Next</span>
                <Icon name="chevronRight" className="h-4 w-4" strokeWidth={2.5} />
            </button>
        </nav>
    );
}

/** Always shows the first and last page, plus a window around the current one. */
function buildPageList(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, index) => index + 1);
    }

    const pages = new Set([1, total, current, current - 1, current + 1]);
    const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

    const result = [];
    let previous = 0;
    for (const page of sorted) {
        if (page - previous > 1) result.push('gap');
        result.push(page);
        previous = page;
    }
    return result;
}
