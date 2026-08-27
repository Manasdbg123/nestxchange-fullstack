import axios from 'axios';

/**
 * The API base URL is configuration, not a constant.
 *
 * It used to be hardcoded to http://localhost:8081, which meant every
 * production build shipped pointing at the developer's own machine. The
 * fallback keeps `npm run dev` working with no setup.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api/v1';

export const TOKEN_STORAGE_KEY = 'rentnest.token';

const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 20000,
});

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
    (response) => response,
    (error) => {
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
        return 'The request timed out. Please check your connection and try again.';
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
