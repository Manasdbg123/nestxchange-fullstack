import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

/* ==========================================================================
   Reusable marketing sections.

   The app had no marketing surface at all - the root URL dropped visitors
   straight into a filter sidebar and a list of raw results, with nothing
   explaining what RentNest is or why anyone would list a property on it.
   ========================================================================== */

export function SectionHeading({ eyebrow, title, description, align = 'center' }) {
    const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';
    return (
        <div className={`max-w-2xl ${alignment}`}>
            {eyebrow ? (
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                    {eyebrow}
                </p>
            ) : null}
            <h2 className="font-display text-3xl font-extrabold text-ink-900 sm:text-4xl dark:text-ink-50">
                {title}
            </h2>
            {description ? (
                <p className="mt-4 text-base leading-relaxed text-ink-500 dark:text-ink-400">
                    {description}
                </p>
            ) : null}
        </div>
    );
}

export function ValueProps({ items }) {
    return (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
                <li key={item.title} className="surface p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                        <Icon name={item.icon} className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">
                        {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                        {item.description}
                    </p>
                </li>
            ))}
        </ul>
    );
}

export function HowItWorks({ steps, id }) {
    return (
        <ol id={id} className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
                <li key={step.title} className="relative">
                    <div className="mb-5 flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500 font-display text-base font-bold text-white">
                            {index + 1}
                        </span>
                        {/* Connector between the numbered steps on wide screens. */}
                        {index < steps.length - 1 ? (
                            <span
                                aria-hidden="true"
                                className="hidden h-px flex-1 bg-ink-200 md:block dark:bg-ink-800"
                            />
                        ) : null}
                    </div>
                    <h3 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">
                        {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                        {step.description}
                    </p>
                </li>
            ))}
        </ol>
    );
}

export function Testimonials({ items }) {
    return (
        <ul className="grid gap-6 md:grid-cols-3">
            {items.map((item) => (
                <li key={item.name} className="surface flex flex-col p-6">
                    <div className="mb-4 flex gap-0.5 text-amber-400" aria-label="Rated 5 out of 5">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <svg key={index} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                                <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.28 3.95a1 1 0 00.95.69h4.15c.97 0 1.37 1.24.59 1.81l-3.36 2.44a1 1 0 00-.36 1.12l1.28 3.95c.3.92-.75 1.69-1.54 1.12l-3.36-2.44a1 1 0 00-1.17 0l-3.36 2.44c-.79.57-1.84-.2-1.54-1.12l1.28-3.95a1 1 0 00-.36-1.12L2.03 9.38c-.78-.57-.38-1.81.59-1.81h4.15a1 1 0 00.95-.69l1.28-3.95z" />
                            </svg>
                        ))}
                    </div>
                    <blockquote className="flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                        “{item.quote}”
                    </blockquote>
                    <footer className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4 dark:border-ink-800">
                        <span
                            aria-hidden="true"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-display text-sm font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-200"
                        >
                            {item.name.charAt(0)}
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{item.name}</p>
                            <p className="text-xs text-ink-500 dark:text-ink-400">
                                {item.role} · {item.city}
                            </p>
                        </div>
                    </footer>
                </li>
            ))}
        </ul>
    );
}

/**
 * Accordion FAQ.
 *
 * Built on <details>/<summary> so it expands without JavaScript, is keyboard
 * operable for free, and is announced correctly by screen readers.
 */
export function Faq({ items }) {
    return (
        <div className="mx-auto max-w-3xl divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-white dark:divide-ink-800 dark:border-ink-800 dark:bg-ink-900">
            {items.map((item) => (
                <details key={item.question} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-ink-900 transition-colors hover:bg-ink-50 dark:text-ink-50 dark:hover:bg-ink-800/60">
                        {item.question}
                        <Icon
                            name="chevronDown"
                            className="h-4 w-4 shrink-0 text-ink-400 transition-transform group-open:rotate-180"
                            strokeWidth={2.5}
                        />
                    </summary>
                    <p className="px-6 pb-5 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                        {item.answer}
                    </p>
                </details>
            ))}
        </div>
    );
}

export function StatStrip({ stats }) {
    return (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink-200 bg-ink-200 sm:grid-cols-4 dark:border-ink-800 dark:bg-ink-800">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-white px-4 py-6 text-center dark:bg-ink-900">
                    <dd className="font-display text-2xl font-extrabold text-brand-600 sm:text-3xl dark:text-brand-300">
                        {stat.value}
                    </dd>
                    <dt className="mt-1 text-xs font-medium text-ink-500 dark:text-ink-400">{stat.label}</dt>
                </div>
            ))}
        </dl>
    );
}

export function CtaBanner({ title, description, primary, secondary }) {
    return (
        <section className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-14 text-center sm:px-12">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent-500/20 blur-3xl"
            />
            <div className="relative mx-auto max-w-2xl">
                <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
                <p className="mt-4 text-base leading-relaxed text-ink-300">{description}</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link to={primary.to} className="btn-primary btn-lg">
                        {primary.label}
                        <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.5} />
                    </Link>
                    {secondary ? (
                        <Link
                            to={secondary.to}
                            className="btn btn-lg border border-white/25 text-white hover:bg-white/10"
                        >
                            {secondary.label}
                        </Link>
                    ) : null}
                </div>
            </div>
        </section>
    );
}

/**
 * Grid of internal links by city and property type.
 *
 * Gives crawlers a path into every listings permutation, which is how property
 * marketplaces get their long-tail search traffic.
 */
export function BrowseLinks({ cities, types }) {
    const [tab, setTab] = useState('cities');
    const panelId = useId();

    const active = tab === 'cities' ? cities : types;

    return (
        <div>
            <div className="mb-6 flex gap-2" role="tablist" aria-label="Browse listings">
                {[
                    { id: 'cities', label: 'By city' },
                    { id: 'types', label: 'By property type' },
                ].map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        role="tab"
                        id={`${panelId}-${option.id}`}
                        aria-selected={tab === option.id}
                        aria-controls={panelId}
                        onClick={() => setTab(option.id)}
                        className={`chip ${tab === option.id ? 'chip-active' : ''}`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <ul
                id={panelId}
                role="tabpanel"
                aria-labelledby={`${panelId}-${tab}`}
                className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4"
            >
                {active.map((link) => (
                    <li key={link.label}>
                        <Link to={link.to} className="text-sm link-quiet">
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
