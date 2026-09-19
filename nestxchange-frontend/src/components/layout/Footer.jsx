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

// category/mode combinations, mirroring the landing page's selector - the
// unified search page (/search) reads `category`/`mode`, not the old
// property-only `type`/`furnishing` params these links used to carry.
// mode=SELL, not BUY: that's the value a seller's listing is actually
// created with, so it's what a buyer needs to search for. See
// toBrowseModeValue in lib/constants.
const CATEGORY_MODE_LINKS = [
    { label: 'Property to rent', to: '/properties?mode=RENT' },
    { label: 'Property to buy', to: '/properties?mode=SELL' },
    { label: 'Vehicles to rent', to: '/vehicles?mode=RENT' },
    { label: 'Vehicles to buy', to: '/vehicles?mode=SELL' },
];

const COMPANY_LINKS = [
    { label: 'How NestXchange works', to: '/list-your-property#how-it-works' },
    { label: 'List your property', to: '/list-your-property' },
    { label: 'Browse listings', to: '/search' },
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
                            <a href="mailto:kaustuk2003@gmail.com" className="link-quiet">
                                kaustuk2003@gmail.com
                            </a>
                        </div>
                    </div>

                    <FooterColumn title="Browse by city">
                        {CITIES.map((city) => (
                            <FooterLink key={city} to={`/search?location=${encodeURIComponent(city)}`}>
                                Listings in {city}
                            </FooterLink>
                        ))}
                    </FooterColumn>

                    <FooterColumn title="Browse by category">
                        {CATEGORY_MODE_LINKS.map((link) => (
                            <FooterLink key={link.label} to={link.to}>
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
                    <p>© {new Date().getFullYear()} NestXchange. A portfolio project, not a live marketplace.</p>
                    <div className="flex flex-wrap gap-5">
                        <Link to="/terms-of-use" className="link-quiet">
                            Terms of use
                        </Link>
                        <Link to="/privacy-policy" className="link-quiet">
                            Privacy policy
                        </Link>
                        <Link to="/contact" className="link-quiet">
                            Contact
                        </Link>
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
