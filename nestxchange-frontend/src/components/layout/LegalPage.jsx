/** Shared shell for Privacy policy / Terms of use: a title, a last-updated date, and numbered sections. */
export default function LegalPage({ title, updated, children }) {
    return (
        <div className="bg-ink-50 py-12 dark:bg-ink-950">
            <div className="container-page max-w-3xl">
                <h1 className="font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50">{title}</h1>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-400">Last updated {updated}</p>

                <div className="surface mt-8 space-y-8 p-6 sm:p-8">{children}</div>
            </div>
        </div>
    );
}

export function LegalSection({ title, children }) {
    return (
        <section>
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">{title}</h2>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{children}</div>
        </section>
    );
}
