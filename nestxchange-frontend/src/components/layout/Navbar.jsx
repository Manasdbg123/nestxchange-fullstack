import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import Logo from './Logo';
import Icon from '../ui/Icon';
import { useAuth } from '../../context/contexts';
import { useTheme } from '../../context/contexts';

const NAV_LINKS = [
    { to: '/properties', label: 'Property & Homes' },
    { to: '/vehicles', label: 'Vehicles' },
];

/**
 * The one navigation bar.
 *
 * Three pages each carried their own hand-rolled header. They had drifted:
 * one had a theme toggle and two did not, the sign-out button went to
 * different places, and only one of them was reachable by keyboard.
 */
export default function Navbar() {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, requireAuth } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    const [menuOpen, setMenuOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [postOpen, setPostOpen] = useState(false);
    const accountRef = useRef(null);
    const postRef = useRef(null);

    // Close the account dropdown on an outside click or Escape.
    useEffect(() => {
        if (!accountOpen) return undefined;

        const onPointerDown = (event) => {
            if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setAccountOpen(false);
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [accountOpen]);

    // Close the "Post a listing" dropdown on an outside click or Escape.
    useEffect(() => {
        if (!postOpen) return undefined;

        const onPointerDown = (event) => {
            if (!postRef.current?.contains(event.target)) setPostOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setPostOpen(false);
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [postOpen]);

    const handleSignOut = () => {
        logout();
        setAccountOpen(false);
        setMenuOpen(false);
        navigate('/');
    };

    const handlePostListing = (category) => {
        setMenuOpen(false);
        setPostOpen(false);
        const destination = `/create-listing?category=${category}`;
        if (isAuthenticated) {
            navigate(destination);
        } else {
            requireAuth({
                reason: category === 'VEHICLE' ? 'Sign in to post your vehicle for free' : 'Sign in to post your property for free',
                onSuccess: () => navigate(destination),
            });
        }
    };

    const navLinkClass = ({ isActive }) =>
        `text-sm font-semibold transition-colors ${
            isActive
                ? 'text-brand-600 dark:text-brand-300'
                : 'text-ink-600 hover:text-brand-600 dark:text-ink-300 dark:hover:text-brand-300'
        }`;

    return (
        <header className="sticky top-0 z-50 border-b border-ink-200/80 bg-white/85 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-950/85">
            {/* Lets keyboard users jump past the nav on every page. */}
            <a
                href="#main"
                className="sr-only-focusable absolute left-4 top-3 z-50 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
                Skip to content
            </a>

            <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Main">
                <div className="flex items-center gap-8">
                    <Logo />
                    <div className="hidden items-center gap-6 md:flex">
                        {NAV_LINKS.map((link) => (
                            <NavLink key={link.to} to={link.to} className={navLinkClass}>
                                {link.label}
                            </NavLink>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="btn-ghost btn-sm rounded-full p-2.5"
                        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                    >
                        <Icon name={isDark ? 'sun' : 'moon'} className="h-5 w-5" />
                    </button>

                    <div className="relative hidden sm:block" ref={postRef}>
                        <button
                            type="button"
                            onClick={() => setPostOpen((open) => !open)}
                            className="btn-outline btn-sm"
                            aria-expanded={postOpen}
                            aria-haspopup="menu"
                        >
                            <Icon name="plus" className="h-4 w-4" strokeWidth={2.5} />
                            Post a listing free
                            <Icon name="chevronDown" className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>

                        {postOpen ? (
                            <div
                                role="menu"
                                className="animate-fade-in absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lift dark:border-ink-700 dark:bg-ink-900"
                            >
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handlePostListing('PROPERTY')}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800"
                                >
                                    <Icon name="building" className="h-4 w-4" />
                                    Post a property
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handlePostListing('VEHICLE')}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800"
                                >
                                    <Icon name="car" className="h-4 w-4" />
                                    Post a vehicle
                                </button>
                            </div>
                        ) : null}
                    </div>

                    {isAuthenticated ? (
                        <div className="relative" ref={accountRef}>
                            <button
                                type="button"
                                onClick={() => setAccountOpen((open) => !open)}
                                className="btn-secondary btn-sm"
                                aria-expanded={accountOpen}
                                aria-haspopup="menu"
                            >
                                <span
                                    aria-hidden="true"
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white"
                                >
                                    {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                                </span>
                                <span className="hidden max-w-[9rem] truncate sm:inline">
                                    {user?.name ?? 'Account'}
                                </span>
                                <Icon name="chevronDown" className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </button>

                            {accountOpen ? (
                                <div
                                    role="menu"
                                    className="animate-fade-in absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lift dark:border-ink-700 dark:bg-ink-900"
                                >
                                    <div className="border-b border-ink-100 px-4 py-3 dark:border-ink-800">
                                        <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
                                            {user?.name}
                                        </p>
                                        <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user?.email}</p>
                                    </div>

                                    <MenuLink to="/my-listings" icon="tag" onSelect={() => setAccountOpen(false)}>
                                        My listings
                                    </MenuLink>
                                    <MenuLink to="/listing-shortlist" icon="heart" onSelect={() => setAccountOpen(false)}>
                                        Shortlist
                                    </MenuLink>
                                    <MenuLink to="/my-inquiries" icon="mail" onSelect={() => setAccountOpen(false)}>
                                        My inquiries
                                    </MenuLink>
                                    <MenuLink to="/my-properties" icon="building" onSelect={() => setAccountOpen(false)}>
                                        My properties (legacy)
                                    </MenuLink>
                                    <MenuLink to="/shortlist" icon="heart" onSelect={() => setAccountOpen(false)}>
                                        Property shortlist (legacy)
                                    </MenuLink>
                                    <MenuLink to="/visits" icon="calendar" onSelect={() => setAccountOpen(false)}>
                                        Site visits (legacy)
                                    </MenuLink>

                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={handleSignOut}
                                        className="flex w-full items-center gap-3 border-t border-ink-100 px-4 py-3 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 dark:border-ink-800 dark:text-ink-200 dark:hover:bg-ink-800"
                                    >
                                        <Icon name="logout" className="h-4 w-4" />
                                        Sign out
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => requireAuth({ reason: 'Welcome back' })}
                            className="btn-primary btn-sm"
                        >
                            Sign in
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        className="btn-ghost btn-sm rounded-full p-2.5 md:hidden"
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                    >
                        <Icon name={menuOpen ? 'close' : 'list'} className="h-5 w-5" strokeWidth={2} />
                        <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
                    </button>
                </div>
            </nav>

            {menuOpen ? (
                <div
                    id="mobile-menu"
                    className="animate-fade-in border-t border-ink-200 bg-white px-4 py-3 md:hidden dark:border-ink-800 dark:bg-ink-950"
                >
                    <div className="flex flex-col gap-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMenuOpen(false)}
                                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <button
                            type="button"
                            onClick={() => handlePostListing('PROPERTY')}
                            className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30"
                        >
                            Post a property free
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePostListing('VEHICLE')}
                            className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30"
                        >
                            Post a vehicle free
                        </button>
                    </div>
                </div>
            ) : null}
        </header>
    );
}

function MenuLink({ to, icon, children, onSelect }) {
    return (
        <Link
            to={to}
            role="menuitem"
            onClick={onSelect}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800"
        >
            <Icon name={icon} className="h-4 w-4" />
            {children}
        </Link>
    );
}
