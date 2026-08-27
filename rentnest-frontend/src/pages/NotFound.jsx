import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import usePageMeta from '../hooks/usePageMeta';

/**
 * 404 page.
 *
 * Any URL the router did not recognise previously rendered nothing at all -
 * a blank white page with no way back.
 */
export default function NotFound() {
    usePageMeta({ title: 'Page not found' });

    return (
        <div className="container-page flex min-h-[65vh] flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon name="search" className="h-9 w-9" strokeWidth={1.5} />
            </div>

            <p className="font-display text-6xl font-extrabold text-ink-200 dark:text-ink-800">404</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                We could not find that page
            </h1>
            <p className="mt-3 max-w-md text-sm text-ink-500 dark:text-ink-400">
                The link may be out of date, or the listing may have been rented out and removed.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/" className="btn-brand btn-md">
                    Back to home
                </Link>
                <Link to="/search" className="btn-secondary btn-md">
                    Browse rentals
                </Link>
            </div>
        </div>
    );
}
