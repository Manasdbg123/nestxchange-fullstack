import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './contexts';
import { authApi } from '../api/endpoints';
import { onUnauthorized, readToken, writeToken } from '../api/client';

/**
 * Session state for the whole app.
 *
 * Before this existed, "am I signed in?" was `!!localStorage.getItem('token')`
 * read during render in half a dozen components, and signing in or out was done
 * with `window.location.reload()` - a full page reload that threw away every
 * bit of loaded state. The token is also verified against the server on boot,
 * so an expired token no longer leaves the UI looking signed in.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState(() => (readToken() ? 'loading' : 'anonymous'));

    // Where to send the visitor after they sign in, when a guarded action
    // triggered the prompt.
    const [authPrompt, setAuthPrompt] = useState(null);

    const clearSession = useCallback(() => {
        writeToken(null);
        setUser(null);
        setStatus('anonymous');
    }, []);

    // Rehydrate on load: a token in storage is a claim, not proof.
    useEffect(() => {
        if (!readToken()) return undefined;

        let cancelled = false;
        authApi
            .me()
            .then((profile) => {
                if (cancelled) return;
                setUser(profile);
                setStatus('authenticated');
            })
            .catch(() => {
                if (!cancelled) clearSession();
            });

        return () => {
            cancelled = true;
        };
    }, [clearSession]);

    // The axios interceptor tells us when the server has rejected our token.
    useEffect(() => onUnauthorized(clearSession), [clearSession]);

    const applySession = useCallback((authResponse) => {
        writeToken(authResponse.token);
        setUser({
            id: authResponse.id,
            name: authResponse.name,
            email: authResponse.email,
            role: authResponse.role,
        });
        setStatus('authenticated');
        return authResponse;
    }, []);

    const login = useCallback(
        (credentials) => authApi.login(credentials).then(applySession),
        [applySession],
    );

    const register = useCallback(
        (details) => authApi.register(details).then(applySession),
        [applySession],
    );

    const logout = useCallback(() => clearSession(), [clearSession]);

    /**
     * Opens the sign-in dialog and remembers what the visitor was trying to do,
     * so the interrupted action can continue once they are authenticated.
     */
    const requireAuth = useCallback(({ reason = 'Sign in to continue', onSuccess } = {}) => {
        setAuthPrompt({ reason, onSuccess });
    }, []);

    const closeAuthPrompt = useCallback(() => setAuthPrompt(null), []);

    const value = useMemo(
        () => ({
            user,
            status,
            isAuthenticated: status === 'authenticated',
            isLoading: status === 'loading',
            login,
            register,
            logout,
            authPrompt,
            requireAuth,
            closeAuthPrompt,
        }),
        [user, status, login, register, logout, authPrompt, requireAuth, closeAuthPrompt],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
