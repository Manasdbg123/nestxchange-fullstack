import { useEffect } from 'react';

const SITE_NAME = 'NestXchange';

/**
 * Sets the document title and meta description per route.
 *
 * A single-page app keeps whatever <title> index.html shipped with unless
 * something changes it, so every page of the old app was called
 * "NestXchange - Premium Property Rentals" - including search results and
 * individual listings, which is poor for both browser history and sharing.
 */
export default function usePageMeta({ title, description } = {}) {
    useEffect(() => {
        if (title) {
            document.title = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
        }

        if (!description) return undefined;

        const tag = document.querySelector('meta[name="description"]');
        const previous = tag?.getAttribute('content');
        tag?.setAttribute('content', description);

        return () => {
            if (tag && previous) tag.setAttribute('content', previous);
        };
    }, [title, description]);
}
