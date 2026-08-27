import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './contexts';

/**
 * One source of truth for light/dark mode.
 *
 * Each page previously owned its own `darkMode` state and wrote to
 * localStorage in an effect, so navigating between pages could flip the theme,
 * and the correct theme was only applied after React had already painted the
 * light one. The class is now set by a tiny inline script in index.html before
 * first paint, and this provider only keeps it in sync afterwards.
 */

const STORAGE_KEY = 'rentnest.theme';

function readStoredTheme() {
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

function systemPrefersDark() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => readStoredTheme() ?? (systemPrefersDark() ? 'dark' : 'light'));

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        root.style.colorScheme = theme;
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* Theme simply will not persist. Not worth failing a render over. */
        }
    }, [theme]);

    // Follow the OS only while the visitor has not made an explicit choice.
    useEffect(() => {
        if (readStoredTheme()) return undefined;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (event) => setTheme(event.matches ? 'dark' : 'light');
        media.addEventListener('change', handler);
        return () => media.removeEventListener('change', handler);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = useMemo(
        () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
        [theme, toggleTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
