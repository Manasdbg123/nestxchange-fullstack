import { createContext, useContext } from 'react';

/**
 * Context objects and their accessor hooks.
 *
 * These live apart from the provider components deliberately: a module that
 * exports both a component and a non-component breaks React Fast Refresh, so
 * editing a provider would force a full page reload during development instead
 * of a hot update.
 */

export const AuthContext = createContext(null);
export const ThemeContext = createContext(null);
export const ToastContext = createContext(null);

function useRequiredContext(context, hookName, providerName) {
    const value = useContext(context);
    if (!value) {
        throw new Error(`${hookName} must be used inside a ${providerName}`);
    }
    return value;
}

export function useAuth() {
    return useRequiredContext(AuthContext, 'useAuth', 'AuthProvider');
}

export function useTheme() {
    return useRequiredContext(ThemeContext, 'useTheme', 'ThemeProvider');
}

export function useToast() {
    return useRequiredContext(ToastContext, 'useToast', 'ToastProvider');
}
