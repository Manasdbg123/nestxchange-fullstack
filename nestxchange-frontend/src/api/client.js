import axios from 'axios';

/**
 * The API base URL is configuration, not a constant.
 *
 * It used to be hardcoded to http://localhost:8081, which meant every
 * production build shipped pointing at the developer's own machine. The
 * fallback keeps `npm run dev` working with no setup.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api/v1';

export const TOKEN_STORAGE_KEY = 'nestxchange.token';

/*
 * Generous on purpose. The API runs on a free instance that sleeps when idle,
 * and a cold start (JVM boot plus migrations) takes 40-60 seconds. A 20 s
 * timeout turned every first visit after a quiet spell into an error page.
 */
const REQUEST_TIMEOUT_MS = 90000;

/** A request still pending after this long is probably waiting on a cold start. */
const SLOW_REQUEST_MS = 4000;

const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: REQUEST_TIMEOUT_MS,
});

/*
 * Slow-request tracking, so the UI can say "the server is starting" instead of
 * showing a spinner for a minute with no explanation. Components subscribe with
 * useSyncExternalStore (see ServerWakeNotice).
 */
let slowRequests = 0;
const slowListeners = new Set();

function setSlow(delta) {
    slowRequests = Math.max(0, slowRequests + delta);
    slowListeners.forEach((listener) => listener());
}

export function subscribeSlowRequests(listener) {
    slowListeners.add(listener);
    return () => slowListeners.delete(listener);
}

export function isWaitingOnServer() {
    return slowRequests > 0;
}

function trackSlow(config) {
    config.metadata = { slowTimer: null, markedSlow: false };
    config.metadata.slowTimer = setTimeout(() => {
        config.metadata.markedSlow = true;
        setSlow(1);
    }, SLOW_REQUEST_MS);
}

function settleSlow(config) {
    if (!config?.metadata) return;
    clearTimeout(config.metadata.slowTimer);
    if (config.metadata.markedSlow) setSlow(-1);
    config.metadata = null;
}

/**
 * Nudge a sleeping backend awake as soon as the page loads, so it is usually
 * ready by the time the visitor searches or signs in. Fire-and-forget.
 */
export function warmUpServer() {
    try {
        const healthUrl = new URL(baseURL, window.location.href);
        healthUrl.pathname = '/actuator/health';
        healthUrl.search = '';
        // no-cors: the response is never read, only the request matters, so no
        // CORS rule is needed and nothing is logged if the origin is not allowed.
        fetch(healthUrl, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
    } catch {
        /* A malformed base URL shows up on the first real request instead. */
    }
}

export function readToken() {
    try {
        return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        // Private browsing and hardened settings can make localStorage throw
        // on access rather than return null.
        return null;
    }
}

export function writeToken(token) {
    try {
        if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
        else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
        /* Session simply will not persist across reloads. */
    }
}

api.interceptors.request.use((config) => {
    trackSlow(config);
    const token = readToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser set the multipart boundary itself.
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});

/**
 * Subscribers are notified when the server rejects our token, so the auth
 * context can clear the session instead of leaving the UI in a signed-in state
 * that fails every request.
 */
const unauthorizedHandlers = new Set();

export function onUnauthorized(handler) {
    unauthorizedHandlers.add(handler);
    return () => unauthorizedHandlers.delete(handler);
}

api.interceptors.response.use(
    (response) => {
        settleSlow(response.config);
        return response;
    },
    (error) => {
        settleSlow(error.config);
        if (error.response?.status === 401 && readToken()) {
            writeToken(null);
            unauthorizedHandlers.forEach((handler) => handler());
        }
        return Promise.reject(error);
    },
);

/**
 * Pulls a message a human can act on out of an error.
 *
 * The API returns a consistent envelope with `message` and optional
 * `fieldErrors`; this collapses both into one string and falls back sensibly
 * for network failures, which have no response at all.
 */
export function toErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
    if (error?.code === 'ECONNABORTED') {
        return 'The server took too long to respond. Please try again in a moment.';
    }
    if (error?.response) {
        const { message, fieldErrors } = error.response.data ?? {};
        const firstFieldError = fieldErrors ? Object.values(fieldErrors)[0] : null;
        return firstFieldError ?? message ?? fallback;
    }
    if (error?.request) {
        return 'We could not reach the server. Please check your connection and try again.';
    }
    return fallback;
}

/** Field-level messages, for rendering errors next to the inputs that caused them. */
export function toFieldErrors(error) {
    return error?.response?.data?.fieldErrors ?? {};
}

export default api;
