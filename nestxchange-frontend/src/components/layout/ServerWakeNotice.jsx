import { useEffect, useSyncExternalStore } from 'react';

import { isWaitingOnServer, subscribeSlowRequests, warmUpServer } from '../../api/client';
import { Spinner } from '../ui/Primitives';

/**
 * Explains a slow first request instead of leaving a silent spinner.
 *
 * The API is hosted on a free instance that sleeps after a quiet spell and takes
 * up to a minute to start again. This appears only while a request has been
 * waiting for more than a few seconds, and disappears on its own once the
 * server answers.
 */
export default function ServerWakeNotice() {
    const waiting = useSyncExternalStore(subscribeSlowRequests, isWaitingOnServer, () => false);

    useEffect(() => {
        warmUpServer();
    }, []);

    if (!waiting) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-800 shadow-lg dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 sm:bottom-5"
        >
            <Spinner className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <div>
                <p className="font-semibold">Starting the server…</p>
                <p className="mt-0.5 text-ink-500 dark:text-ink-400">
                    It sleeps when nobody has visited for a while. This first load can take up to a
                    minute; everything after it is fast.
                </p>
            </div>
        </div>
    );
}
