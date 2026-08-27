import { useCallback, useEffect, useState } from 'react';

/**
 * Runs an async fetch and reports its status.
 *
 * The obvious way to write this is `setLoading(true)` at the top of the effect,
 * but a synchronous setState inside an effect body schedules a second render
 * before the browser paints, and React flags it for good reason.
 *
 * Instead the resolved value is tagged with the request key it belongs to, and
 * "loading" is *derived* during render by comparing that tag with the key the
 * caller is currently asking for. State is only ever set from inside the async
 * callbacks, and the loading flag is still correct the instant the key changes.
 *
 * @param cacheKey  a string identifying this request; change it to refetch
 * @param fetcher   memoised with useCallback by the caller
 */
export default function useAsync(cacheKey, fetcher) {
    const [state, setState] = useState({ key: null, data: null, error: null });
    const [nonce, setNonce] = useState(0);

    const requestKey = `${cacheKey}#${nonce}`;

    useEffect(() => {
        let cancelled = false;

        fetcher()
            .then((data) => {
                if (!cancelled) setState({ key: requestKey, data, error: null });
            })
            .catch((error) => {
                if (!cancelled) setState({ key: requestKey, data: null, error });
            });

        return () => {
            cancelled = true;
        };
    }, [requestKey, fetcher]);

    /** Re-runs the fetcher with the same key. */
    const refresh = useCallback(() => setNonce((current) => current + 1), []);

    /** Lets a caller patch the loaded data locally after a mutation. */
    const mutate = useCallback((updater) => {
        setState((current) => ({
            ...current,
            data: typeof updater === 'function' ? updater(current.data) : updater,
        }));
    }, []);

    return {
        data: state.data,
        error: state.key === requestKey ? state.error : null,
        loading: state.key !== requestKey,
        refresh,
        mutate,
    };
}
