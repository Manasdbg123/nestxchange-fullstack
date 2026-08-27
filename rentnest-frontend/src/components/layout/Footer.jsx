import { Link } from 'react-router-dom';
import Logo from './Logo';
import Icon from '../ui/Icon';

/**
 * Site footer.
 *
 * The app previously had none at all - no legal links, no company information,
 * and no internal links for search engines to follow into the city and
 * property-type pages. The city/type grid mirrors the pattern every major
 * property marketplace uses to get its listing pages indexed.
 */

const CITIES = ['Bengaluru', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad', 'Chennai'];

const PROPERTY_LINKS = [
    { label: 'Flats for rent', params: 'type=APARTMENT' },
    { label: 'Independent houses', params: 'type=HOUSE' },
    { label: 'Villas for rent', params: 'type=VILLA' },
    { label: 'PG & hostels', params: 'type=PG&type=ROOM' },
    { label: 'Shops & offices', params: 'type=SHOP&type=COMMERCIAL' },
    { label: 'Furnished homes', params: 'furnishing=FULLY_FURNISHED' },
];

const COMPANY_LINKS = [
    { label: 'How RentNest works', to: '/list-your-property#how-it-works' },
    { label: 'List your property', to: '/list-your-property' },
    { label: 'Browse rentals', to: '/search' },
];

export default function Footer() {
    return (
        <footer className="mt-20 border-t border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
            <div className="container-page py-12">
                <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
                    <div>
                        <Logo />
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                            Rent directly from verified owners. No brokers, no brokerage, no surprises at
                            move-in.
                        </p>
                        <div className="mt-5 flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
                            <Icon name="mail" className="h-4 w-4" />
                            <a href="mailto:hello@rentnest.example" className="link-quiet">
                                hello@rentnest.example
                            </a>
                        </div>
                    </div>

                    <FooterColumn title="Rent by city">
                        {CITIES.map((city) => (
                            <FooterLink key={city} to={`/search?city=${encodeURIComponent(city)}`}>
                                Rentals in {city}
                            </FooterLink>
                        ))}
                    </FooterColumn>

                    <FooterColumn title="Rent by type">
                        {PROPERTY_LINKS.map((link) => (
                            <FooterLink key={link.label} to={`/search?${link.params}`}>
                                {link.label}
                            </FooterLink>
                        ))}
                    </FooterColumn>

                    <FooterColumn title="Company">
                        {COMPANY_LINKS.map((link) => (
                            <FooterLink key={link.label} to={link.to}>
                                {link.label}
                            </FooterLink>
                        ))}
                    </FooterColumn>
                </div>

                <div className="mt-10 flex flex-col gap-4 border-t border-ink-200 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between dark:border-ink-800 dark:text-ink-400">
                    <p>© {new Date().getFullYear()} RentNest. A portfolio project, not a live marketplace.</p>
                    <div className="flex flex-wrap gap-5">
                        <span>Terms of use</span>
                        <span>Privacy policy</span>
                        <span>Contact</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterColumn({ title, children }) {
    return (
        <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-ink-100">
                {title}
            </h2>
            <ul className="mt-4 space-y-2.5">{children}</ul>
        </div>
    );
}

function FooterLink({ to, children }) {
    return (
        <li>
            <Link to={to} className="text-sm link-quiet">
                {children}
            </Link>
        </li>
    );
}
