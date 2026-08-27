import { useCallback, useMemo, useRef, useState } from 'react';
import { ToastContext } from './contexts';

/**
 * Non-blocking notifications.
 *
 * Replaces the `alert()` and `window.confirm()` calls the app used for errors
 * and confirmations - those freeze the page, cannot be styled, and read as a
 * browser malfunction rather than as part of the product.
 */

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(1);

    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const push = useCallback(
        (message, { variant = 'info', duration = DEFAULT_DURATION } = {}) => {
            const id = nextId.current++;
            setToasts((current) => [...current, { id, message, variant }]);
            if (duration > 0) {
                window.setTimeout(() => dismiss(id), duration);
            }
            return id;
        },
        [dismiss],
    );

    const value = useMemo(
        () => ({
            toasts,
            dismiss,
            notify: push,
            success: (message, options) => push(message, { ...options, variant: 'success' }),
            error: (message, options) => push(message, { ...options, variant: 'error' }),
            info: (message, options) => push(message, { ...options, variant: 'info' }),
        }),
        [toasts, dismiss, push],
    );

    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
