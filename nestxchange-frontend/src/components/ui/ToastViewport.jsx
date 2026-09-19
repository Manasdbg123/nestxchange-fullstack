import { useToast } from '../../context/contexts';
import Icon from './Icon';

const TONES = {
    success: {
        icon: 'check',
        className: 'border-emerald-200 bg-white text-emerald-800 dark:border-emerald-800 dark:bg-ink-900 dark:text-emerald-300',
    },
    error: {
        icon: 'warning',
        className: 'border-accent-200 bg-white text-accent-700 dark:border-accent-800 dark:bg-ink-900 dark:text-accent-300',
    },
    info: {
        icon: 'info',
        className: 'border-ink-200 bg-white text-ink-800 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100',
    },
};

export default function ToastViewport() {
    const { toasts, dismiss } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div
            // `polite` rather than `assertive`: these announce results, they do
            // not interrupt what the visitor is doing.
            aria-live="polite"
            aria-atomic="false"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
        >
            {toasts.map((toast) => {
                const tone = TONES[toast.variant] ?? TONES.info;
                return (
                    <div
                        key={toast.id}
                        className={`animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lift ${tone.className}`}
                    >
                        <Icon name={tone.icon} className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} />
                        <p className="flex-1 font-medium">{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => dismiss(toast.id)}
                            className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                        >
                            <Icon name="close" className="h-4 w-4" strokeWidth={2} />
                            <span className="sr-only">Dismiss notification</span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
