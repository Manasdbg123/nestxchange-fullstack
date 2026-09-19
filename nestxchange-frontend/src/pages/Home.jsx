import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import CategoryModeSelector from '../components/listings/CategoryModeSelector';
import {
    BrowseLinks,
    CtaBanner,
    Faq,
    HowItWorks,
    SectionHeading,
    StatStrip,
    Testimonials,
    ValueProps,
} from '../components/marketing/Sections';
import PropertyCard from '../components/property/PropertyCard';
import PropertyCardSkeleton from '../components/property/PropertyCardSkeleton';
import Icon from '../components/ui/Icon';
import usePageMeta from '../hooks/usePageMeta';
import useFavorites from '../hooks/useFavorites';
import { propertyApi } from '../api/endpoints';
import { LISTING_CATEGORIES, LISTING_MODES } from '../lib/constants';

/**
 * The marketing home page.
 *
 * The root URL previously rendered the raw search results screen - filter
 * sidebar, result count and all - so a first-time visitor arrived at a database
 * query rather than at an explanation of the product.
 */
export default function Home() {
    usePageMeta({
        title: 'Rent homes directly from owners, zero brokerage',
        description:
            'Browse verified flats, houses, PGs and commercial spaces across India. Talk to owners directly and pay no brokerage.',
    });

    const { isFavorited, toggleFavorite } = useFavorites();
    const [cities, setCities] = useState([]);
    const [featured, setFeatured] = useState([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);

    useEffect(() => {
        let cancelled = false;

        propertyApi
            .popularCities(6)
            .then((result) => !cancelled && setCities(result))
            .catch(() => {
                /* The hero still works without city shortcuts. */
            });

        propertyApi
            .search({ verifiedOnly: true, sortBy: 'newest' }, { page: 0, size: 6 })
            .then((result) => !cancelled && setFeatured(result.content ?? []))
            .catch(() => !cancelled && setFeatured([]))
            .finally(() => !cancelled && setLoadingFeatured(false));

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <>
            {/* ---------------------------------------------------------- Hero */}
            <section className="relative overflow-hidden bg-ink-900">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl"
                />

                <div className="container-page relative py-20 sm:py-28">
                    <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white">
                                <Icon name="wallet" className="h-3.5 w-3.5" strokeWidth={2.5} />
                                Zero brokerage, always
                            </span>

                            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                                Property and vehicles
                                <span className="block text-brand-300">rent, buy or sell - one place</span>
                            </h1>

                            <p className="mt-5 text-lg leading-relaxed text-ink-300">
                                No agents in the middle, no brokerage lost to a broker. Search verified
                                listings, talk to owners directly, and close the deal on your own terms.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    to="/list-your-property"
                                    className="btn btn-lg border border-white/25 text-white hover:bg-white/10"
                                >
                                    Property owner? List for free
                                </Link>
                            </div>
                        </div>

                        <div className="w-full lg:max-w-xl">
                            <CategoryModeSelector />
                        </div>
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------------- Category */}
            <section className="border-b border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
                <div className="container-page flex gap-3 overflow-x-auto py-5 hide-scrollbar">
                    {LISTING_CATEGORIES.flatMap((category) =>
                        LISTING_MODES.map((mode) => (
                            <Link
                                key={`${category.value}-${mode.value}`}
                                to={`/search?category=${category.value}&mode=${mode.value}`}
                                className="chip shrink-0"
                            >
                                {category.label} to {mode.label.toLowerCase()}
                            </Link>
                        )),
                    )}
                </div>
            </section>

            {/* ---------------------------------------------------------- Stats */}
            <section className="container-page py-14">
                <StatStrip
                    stats={[
                        { value: '₹0', label: 'Brokerage, on every listing' },
                        { value: '5 cities', label: 'And growing across India' },
                        { value: '24 hrs', label: 'Typical owner response time' },
                        { value: '100%', label: 'Listings posted by owners' },
                    ]}
                />
            </section>

            {/* ------------------------------------------------------- Featured */}
            <section className="container-page pb-16">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <SectionHeading
                        align="left"
                        eyebrow="Handpicked"
                        title="Verified homes, ready to move into"
                        description="Every listing below has been checked by our team and is available for viewing now."
                    />
                    <Link to="/search" className="btn-secondary btn-md">
                        See all listings
                        <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.5} />
                    </Link>
                </div>

                {loadingFeatured ? (
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2].map((key) => (
                            <PropertyCardSkeleton key={key} layout="grid" />
                        ))}
                    </div>
                ) : featured.length === 0 ? (
                    <div className="surface px-6 py-12 text-center">
                        <p className="text-sm text-ink-500 dark:text-ink-400">
                            No verified listings are live right now. Browse everything on offer instead.
                        </p>
                        <Link to="/search" className="btn-brand btn-md mt-5">
                            Browse all rentals
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {featured.map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                layout="grid"
                                isFavorited={isFavorited(property.id)}
                                onToggleFavorite={toggleFavorite}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ----------------------------------------------------- Value props */}
            <section className="bg-white py-16 dark:bg-ink-950">
                <div className="container-page">
                    <SectionHeading
                        eyebrow="Why NestXchange"
                        title="Renting, without the middleman tax"
                        description="Brokerage in most Indian cities costs a full month's rent. Here, it costs nothing - because there is no broker."
                    />

                    <div className="mt-12">
                        <ValueProps
                            items={[
                                {
                                    icon: 'wallet',
                                    title: 'Save a month of rent',
                                    description:
                                        'You deal with the owner directly, so there is no brokerage to pay at any stage of the process.',
                                },
                                {
                                    icon: 'shield',
                                    title: 'Verified listings',
                                    description:
                                        'Listings carrying the verified badge have had their ownership and details checked by our team.',
                                },
                                {
                                    icon: 'phone',
                                    title: 'Talk to the actual owner',
                                    description:
                                        'Contact details belong to the person who owns the property, not to a call centre reselling your number.',
                                },
                                {
                                    icon: 'calendar',
                                    title: 'Book visits in the app',
                                    description:
                                        'Pick a slot that suits you and the owner confirms or suggests another. No endless phone tag.',
                                },
                                {
                                    icon: 'filter',
                                    title: 'Filters that actually filter',
                                    description:
                                        'Budget, BHK, furnishing, tenant preference and move-in date all narrow the results properly.',
                                },
                                {
                                    icon: 'sparkles',
                                    title: 'Free to list',
                                    description:
                                        'Owners post as many properties as they like at no cost, with photos, amenities and availability.',
                                },
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* --------------------------------------------------- How it works */}
            <section className="container-page py-16">
                <SectionHeading
                    eyebrow="How it works"
                    title="From search to keys in three steps"
                />
                <div className="mt-12">
                    <HowItWorks
                        steps={[
                            {
                                title: 'Search and shortlist',
                                description:
                                    'Filter by locality, budget and configuration, then save the homes you like to your shortlist.',
                            },
                            {
                                title: 'Contact the owner',
                                description:
                                    'Reveal the owner\'s number and request a viewing at a time that works for both of you.',
                            },
                            {
                                title: 'Close the deal directly',
                                description:
                                    'Agree the rent and deposit with the owner and move in. No brokerage changes hands.',
                            },
                        ]}
                    />
                </div>
            </section>

            {/* ---------------------------------------------------- Testimonials */}
            <section className="bg-white py-16 dark:bg-ink-950">
                <div className="container-page">
                    <SectionHeading eyebrow="From our users" title="What tenants and owners tell us" />
                    <div className="mt-12">
                        <Testimonials
                            items={[
                                {
                                    name: 'Sneha Ramesh',
                                    role: 'Tenant',
                                    city: 'Bengaluru',
                                    quote:
                                        'I found a 2 BHK in Indiranagar in under two weeks and saved the brokerage entirely. Talking to the owner from the start made the whole thing far less stressful.',
                                },
                                {
                                    name: 'Arun Prakash',
                                    role: 'Owner',
                                    city: 'Pune',
                                    quote:
                                        'Listing was free and took about ten minutes. I had four genuine visit requests in the first week and let out the flat by the end of the month.',
                                },
                                {
                                    name: 'Fatima Sheikh',
                                    role: 'Tenant',
                                    city: 'Mumbai',
                                    quote:
                                        'The filters were the difference. Being able to narrow down to furnished, family-friendly places available immediately saved me a lot of wasted visits.',
                                },
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* -------------------------------------------------------- Browse */}
            <section className="container-page py-16">
                <SectionHeading align="left" eyebrow="Explore" title="Browse across India" />
                <div className="mt-8">
                    <BrowseLinks
                        cities={(cities.length ? cities : ['Bengaluru', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad']).map(
                            (city) => ({
                                label: `Listings in ${city}`,
                                to: `/search?location=${encodeURIComponent(city)}`,
                            }),
                        )}
                        types={LISTING_CATEGORIES.flatMap((category) =>
                            LISTING_MODES.map((mode) => ({
                                label: `${category.label} to ${mode.label.toLowerCase()}`,
                                to: `/search?category=${category.value}&mode=${mode.value}`,
                            })),
                        )}
                    />
                </div>
            </section>

            {/* ----------------------------------------------------------- FAQ */}
            <section className="bg-white py-16 dark:bg-ink-950">
                <div className="container-page">
                    <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
                    <div className="mt-10">
                        <Faq
                            items={[
                                {
                                    question: 'Is NestXchange really free for tenants?',
                                    answer:
                                        'Yes. Searching, shortlisting, contacting owners and requesting visits are all free. There is no brokerage and no platform fee.',
                                },
                                {
                                    question: 'What does the verified badge mean?',
                                    answer:
                                        'It means our team has confirmed the listing details and that the person posting it is the owner or their authorised representative. Listings without the badge are not necessarily fake - they simply have not been through that check yet.',
                                },
                                {
                                    question: 'Do I need an account to see listings?',
                                    answer:
                                        'No. Every listing page is public. You only need an account to save a shortlist, reveal an owner\'s phone number, request a visit, or post a property of your own.',
                                },
                                {
                                    question: 'How do I list my property?',
                                    answer:
                                        'Create a free account, click "Post property free", and fill in the details along with a few photos. Your listing goes live straight away and you can edit or pause it at any time.',
                                },
                                {
                                    question: 'How does NestXchange make money then?',
                                    answer:
                                        'This is a portfolio project rather than a live business, so it does not. A real deployment would typically charge owners for optional promotion or add-on services such as rental agreements.',
                                },
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* ----------------------------------------------------------- CTA */}
            <section className="container-page pb-8">
                <CtaBanner
                    title="Have a property sitting empty?"
                    description="List it in a few minutes, reach tenants directly, and keep the brokerage you would otherwise have paid."
                    primary={{ to: '/list-your-property', label: 'List your property free' }}
                    secondary={{ to: '/search', label: 'Browse listings instead' }}
                />
            </section>
        </>
    );
}
