import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/contexts';
import { Spinner } from '../ui/Primitives';

/**
 * Guards a route that needs a signed-in user.
 *
 * The previous version called `alert()` during render - a side effect in a
 * render body, which React runs twice in development, so the alert appeared
 * twice - and then redirected home, losing the page the visitor wanted. It also
 * treated "still checking the stored token" as "signed out", so a hard refresh
 * on a protected page bounced you to the home page every time.
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading, requireAuth } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            requireAuth({ reason: 'Sign in to continue to this page' });
        }
    }, [isLoading, isAuthenticated, requireAuth]);

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center" role="status">
                <Spinner className="h-8 w-8 text-brand-500" />
                <span className="sr-only">Checking your session</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        // `state` carries the intended destination so the visitor lands where
        // they meant to go once they sign in.
        return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
    }

    return children;
}
