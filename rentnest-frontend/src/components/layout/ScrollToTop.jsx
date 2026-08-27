import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets scroll position on navigation.
 *
 * A client-side router keeps the scroll offset when the path changes, so
 * clicking a listing from halfway down the search results used to open the
 * detail page already scrolled into its middle.
 */
export default function ScrollToTop() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (hash) {
            // An in-page anchor: let the browser find the target instead.
            const target = document.querySelector(hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname, hash]);

    return null;
}
