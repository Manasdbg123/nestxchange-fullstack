import { Component } from 'react';
import Icon from '../ui/Icon';

/**
 * Catches render-time crashes.
 *
 * Without this, one bad field in one listing (a null `furnishingStatus`, say -
 * which the old code called `.replace()` on unguarded) unmounts the entire
 * React tree and leaves the visitor staring at a blank white page.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // Replace with a real error reporter when one is available.
        console.error('Unhandled UI error:', error, info);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-500 dark:bg-accent-950/40">
                    <Icon name="warning" className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Something went wrong</h1>
                <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">
                    This page hit an unexpected error. Reloading usually clears it.
                </p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="btn-brand btn-md mt-6"
                >
                    Reload the page
                </button>
            </div>
        );
    }
}
