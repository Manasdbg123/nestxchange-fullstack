import { forwardRef, useEffect, useId, useRef } from 'react';
import Icon from './Icon';

/* ==========================================================================
   Small shared building blocks.
   ========================================================================== */

export function Spinner({ className = 'h-5 w-5' }) {
    return (
        <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

export function Badge({ tone = 'neutral', icon, children, className = '' }) {
    const tones = {
        neutral: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
        brand: 'bg-brand-500 text-white',
        accent: 'bg-accent-500 text-white',
        info: 'bg-blue-600 text-white',
        success: 'bg-emerald-600 text-white',
        warning: 'bg-amber-500 text-white',
        muted: 'bg-white/90 text-ink-800 dark:bg-ink-900/90 dark:text-ink-100',
    };

    return (
        <span className={`badge ${tones[tone] ?? tones.neutral} ${className}`}>
            {icon ? <Icon name={icon} className="h-3 w-3" strokeWidth={2.5} /> : null}
            {children}
        </span>
    );
}

/**
 * A labelled text input.
 *
 * Every field in the old forms was a bare <input> with a <label> that had no
 * `htmlFor`, so clicking a label did nothing and screen readers announced the
 * inputs as unlabelled.
 */
export const Field = forwardRef(function Field(
    { label, hint, error, className = '', as = 'input', children, ...props },
    ref,
) {
    const generatedId = useId();
    const id = props.id ?? generatedId;
    const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
        .filter(Boolean)
        .join(' ');

    const Element = as;

    return (
        <div className={className}>
            {label ? (
                <label className="label" htmlFor={id}>
                    {label}
                    {props.required ? <span className="ml-1 text-accent-500">*</span> : null}
                </label>
            ) : null}

            <Element
                {...props}
                id={id}
                ref={ref}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={describedBy || undefined}
                className={`field ${error ? 'field-invalid' : ''}`}
            >
                {children}
            </Element>

            {hint && !error ? (
                <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
                    {hint}
                </p>
            ) : null}

            {error ? (
                <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-accent-600 dark:text-accent-400">
                    <Icon name="warning" className="h-3.5 w-3.5" strokeWidth={2} />
                    {error}
                </p>
            ) : null}
        </div>
    );
});

export function EmptyState({ icon = 'home', title, description, action }) {
    return (
        <div className="surface animate-fade-in flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon name={icon} className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50">{title}</h3>
            {description ? (
                <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">{description}</p>
            ) : null}
            {action ? <div className="mt-6">{action}</div> : null}
        </div>
    );
}

/**
 * A modal dialog with the accessibility behaviour browsers do not give you
 * for free: focus moves in, Escape closes, background scroll is locked, and
 * focus returns to whatever opened it.
 */
export function Modal({ open, onClose, title, description, children, size = 'md' }) {
    const panelRef = useRef(null);
    const previouslyFocused = useRef(null);
    const titleId = useId();
    // The latest onClose, read by the keydown handler without re-running the
    // open/close effect (which would steal focus back on every parent render).
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;

        previouslyFocused.current = document.activeElement;
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                onCloseRef.current?.();
                return;
            }
            if (event.key !== 'Tab' || !panelRef.current) return;

            // Keep Tab inside the dialog rather than letting it wander into the
            // inert page behind the backdrop.
            const focusable = panelRef.current.querySelectorAll(
                'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        window.requestAnimationFrame(() => {
            panelRef.current?.querySelector('input, button, [tabindex]')?.focus();
        });

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = overflow;
            previouslyFocused.current?.focus?.();
        };
    }, [open]);

    if (!open) return null;

    const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                className={`animate-rise relative w-full ${widths[size] ?? widths.md} overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-lift dark:border-ink-800 dark:bg-ink-900`}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-full p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-ink-800 dark:hover:text-ink-100"
                >
                    <Icon name="close" className="h-4 w-4" strokeWidth={2} />
                    <span className="sr-only">Close</span>
                </button>

                {title ? (
                    <div className="border-b border-ink-100 px-6 pb-4 pt-6 dark:border-ink-800">
                        <h2 id={titleId} className="text-xl font-bold text-ink-900 dark:text-ink-50">
                            {title}
                        </h2>
                        {description ? (
                            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>
                        ) : null}
                    </div>
                ) : null}

                <div className="max-h-[75vh] overflow-y-auto scrollbar-slim">{children}</div>
            </div>
        </div>
    );
}

/** An inline, dismissible error panel for form-level failures. */
export function Alert({ tone = 'error', children, onDismiss }) {
    const tones = {
        error: 'border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-900 dark:bg-accent-950/40 dark:text-accent-300',
        info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
    };
    const icons = { error: 'warning', info: 'info', success: 'check' };

    return (
        <div
            role="alert"
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${tones[tone] ?? tones.error}`}
        >
            <Icon name={icons[tone] ?? 'warning'} className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="flex-1">{children}</span>
            {onDismiss ? (
                <button type="button" onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100">
                    <Icon name="close" className="h-4 w-4" strokeWidth={2} />
                    <span className="sr-only">Dismiss</span>
                </button>
            ) : null}
        </div>
    );
}
