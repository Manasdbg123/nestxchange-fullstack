import usePageMeta from '../hooks/usePageMeta';
import Icon from '../components/ui/Icon';

const CONTACT = {
    name: 'Manas Kumar',
    phone: '+91 70613 56710',
    phoneHref: 'tel:+917061356710',
    email: 'kaustuk2003@gmail.com',
    address: 'New Delhi, 110086, India',
};

/**
 * Contact page. A single, honest point of contact rather than a fake
 * "support team" - this is a portfolio project run by one person.
 */
export default function Contact() {
    usePageMeta({ title: 'Contact us' });

    return (
        <div className="bg-ink-50 py-12 dark:bg-ink-950">
            <div className="container-page max-w-3xl">
                <h1 className="font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50">Contact us</h1>
                <p className="mt-3 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                    Questions about a listing, a bug you've run into, or feedback on NestXchange? Reach out directly
                    below.
                </p>

                <div className="surface mt-8 grid gap-6 p-6 sm:grid-cols-2">
                    <ContactRow icon="user" label="Name" value={CONTACT.name} />
                    <ContactRow icon="phone" label="Phone" value={CONTACT.phone} href={CONTACT.phoneHref} />
                    <ContactRow icon="mail" label="Email" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
                    <ContactRow icon="pin" label="Location" value={CONTACT.address} />
                </div>

                <p className="mt-6 text-xs text-ink-400 dark:text-ink-500">
                    NestXchange is a portfolio project, not a registered brokerage or dealership. See our{' '}
                    <a href="/terms-of-use" className="link-quiet">
                        Terms of use
                    </a>{' '}
                    for details.
                </p>
            </div>
        </div>
    );
}

function ContactRow({ icon, label, value, href }) {
    return (
        <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon name={icon} className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
                {href ? (
                    <a href={href} className="text-sm font-semibold text-ink-900 hover:text-brand-600 dark:text-ink-50 dark:hover:text-brand-300">
                        {value}
                    </a>
                ) : (
                    <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{value}</p>
                )}
            </div>
        </div>
    );
}
