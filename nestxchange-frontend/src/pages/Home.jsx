import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
    BrowseLinks,
    CtaBanner,
    Faq,
    HowItWorks,
    MarketplaceChoiceCards,
    SectionHeading,
    StatStrip,
    Testimonials,
    ValueProps,
} from '../components/marketing/Sections';
import ListingCard from '../components/listings/ListingCard';
import ListingCardSkeleton from '../components/listings/ListingCardSkeleton';
import Icon from '../components/ui/Icon';
import usePageMeta from '../hooks/usePageMeta';
import useListingFavorites from '../hooks/useListingFavorites';
import { listingApi } from '../api/endpoints';
import { BROWSE_MODES } from '../lib/constants';

/**
 * The marketing home page.
 *
 * The root URL previously rendered the raw search results screen - filter
 * sidebar, result count and all - so a first-time visitor arrived at a database
 * query rather than at an explanation of the product.
 */
export default function Home() {
    usePageMeta({
        title: 'Find your next place. Discover your next drive.',
        description:
            'Explore homes and vehicles to rent or buy, all in one trusted marketplace. Talk to owners directly and pay no brokerage.',
    });

    const { isFavorited, toggleFavorite } = useListingFavorites();
    const [cities] = useState(['Patna', 'Darbhanga', 'Muzaffarpur', 'Madhubani', 'Bhagalpur']);
    const [featured, setFeatured] = useState([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);

    useEffect(() => {
        let cancelled = false;

        // No category filter: this intentionally mixes properties and
        // vehicles so the home page reflects both marketplaces, not just one.
        listingApi
            .search({}, { page: 0, size: 6 })
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

                <div className="container-page relative py-16 sm:py-24">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white">
                            <Icon name="wallet" className="h-3.5 w-3.5" strokeWidth={2.5} />
                            Zero brokerage, always
                        </span>

                        <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                            Find your next place.
                            <span className="block text-brand-300">Discover your next drive.</span>
                        </h1>

                        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-300">
                            Explore homes and vehicles to rent or buy, all in one trusted marketplace.
                            Talk to owners directly - no agents, no brokerage.
                        </p>
                    </div>

                    {/* The two marketplaces, equally weighted - this is the whole
                        point of the homepage. Everything else on this page is
                        secondary to picking one of these. */}
                    <div className="mx-auto mt-12 max-w-4xl">
                        <MarketplaceChoiceCards
                            choices={[
                                {
                                    to: '/properties',
                                    icon: 'building',
                                    title: 'Property & Homes',
                                    description:
                                        'Find your next home, explore properties for sale, or rent out your space.',
                                    cta: 'Explore Properties',
                                    image:
                                        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=1000',
                                },
                                {
                                    to: '/vehicles',
                                    icon: 'car',
                                    title: 'Vehicles',
                                    description: 'Discover cars, bikes, and more for rent or purchase.',
                                    cta: 'Explore Vehicles',
                                    image:
                                        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1000',
                                },
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- Stats */}
            <section className="container-page py-14">
                <StatStrip
                    stats={[
                        { value: '₹0', label: 'Brokerage, on every listing' },
                        { value: '5 cities', label: 'And growing across Bihar' },
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
                        title="Fresh on NestXchange"
                        description="The newest properties and vehicles listed by real owners, mixed together right here."
                    />
                    <Link to="/search" className="btn-secondary btn-md">
                        See all listings
                        <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.5} />
                    </Link>
                </div>

                {loadingFeatured ? (
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2].map((key) => (
                            <ListingCardSkeleton key={key} />
                        ))}
                    </div>
                ) : featured.length === 0 ? (
                    <div className="surface px-6 py-12 text-center">
                        <p className="text-sm text-ink-500 dark:text-ink-400">
                            No listings are live right now. Browse everything on offer instead.
                        </p>
                        <Link to="/search" className="btn-brand btn-md mt-5">
                            Browse all listings
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {featured.map((listing) => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                isFavorited={isFavorited(listing.id)}
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
                        title="No middleman, on property or vehicles"
                        description="Brokerage and dealer markups eat into every deal. Here, you deal directly with the owner - for a house or a car - so there's nothing extra to pay."
                    />

                    <div className="mt-12">
                        <ValueProps
                            items={[
                                {
                                    icon: 'wallet',
                                    title: 'Skip the brokerage',
                                    description:
                                        'You deal with the owner directly, so there is no brokerage or dealer commission to pay at any stage.',
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
                                        'Contact details belong to the person who owns the property or vehicle, not to a call centre reselling your number.',
                                },
                                {
                                    icon: 'calendar',
                                    title: 'Book visits or test drives',
                                    description:
                                        'Pick a slot that suits you and the owner confirms or suggests another. No endless phone tag.',
                                },
                                {
                                    icon: 'filter',
                                    title: 'Filters that actually filter',
                                    description:
                                        'Budget and configuration for a home, or make, mileage and year for a vehicle - each category narrows results on what actually matters.',
                                },
                                {
                                    icon: 'sparkles',
                                    title: 'Free to list',
                                    description:
                                        'Owners post as many properties or vehicles as they like at no cost, with photos and full details.',
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
                                    'Filter by location, budget and configuration, then save the properties or vehicles you like to your shortlist.',
                            },
                            {
                                title: 'Contact the owner',
                                description:
                                    'Reveal the owner\'s number and request a viewing or test drive at a time that works for both of you.',
                            },
                            {
                                title: 'Close the deal directly',
                                description:
                                    'Agree the price directly with the owner and complete the deal. No brokerage changes hands.',
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
                                    city: 'Patna',
                                    quote:
                                        'I found a 2 BHK near Boring Road in under two weeks and saved the brokerage entirely. Talking to the owner from the start made the whole thing far less stressful.',
                                },
                                {
                                    name: 'Arun Prakash',
                                    role: 'Owner',
                                    city: 'Darbhanga',
                                    quote:
                                        'Listing was free and took about ten minutes. I had four genuine visit requests in the first week and let out the flat by the end of the month.',
                                },
                                {
                                    name: 'Rohit Malhotra',
                                    role: 'Buyer',
                                    city: 'Muzaffarpur',
                                    quote:
                                        'Bought a used sedan straight from the owner - saw the service history, took it for a test drive, and closed the deal without a dealer markup anywhere in between.',
                                },
                                {
                                    name: 'Fatima Sheikh',
                                    role: 'Tenant',
                                    city: 'Madhubani',
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
                <SectionHeading align="left" eyebrow="Explore" title="Browse across Bihar" />
                <div className="mt-8">
                    <BrowseLinks
                        cities={(cities.length ? cities : ['Patna', 'Darbhanga', 'Muzaffarpur', 'Madhubani', 'Bhagalpur']).map(
                            (city) => ({
                                label: `Listings in ${city}`,
                                to: `/search?location=${encodeURIComponent(city)}`,
                            }),
                        )}
                        types={[
                            ...BROWSE_MODES.map((mode) => ({
                                label: `Property to ${mode.label.toLowerCase()}`,
                                to: `/properties?mode=${mode.value}`,
                            })),
                            ...BROWSE_MODES.map((mode) => ({
                                label: `Vehicles to ${mode.label.toLowerCase()}`,
                                to: `/vehicles?mode=${mode.value}`,
                            })),
                        ]}
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
                                        'No. Every listing page is public. You only need an account to save a shortlist, reveal an owner\'s phone number, request a visit, or post a property or vehicle of your own.',
                                },
                                {
                                    question: 'How do I list a property or vehicle?',
                                    answer:
                                        'Create a free account, click "Post a listing free" in the navigation bar, choose Property or Vehicle, and fill in the details along with a few photos. Your listing goes live straight away and you can edit or pause it at any time.',
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
                    title="Have a property or vehicle sitting idle?"
                    description="List it in a few minutes, reach buyers or tenants directly, and keep the brokerage you would otherwise have paid."
                    primary={{ to: '/create-listing', label: 'Post a listing free' }}
                    secondary={{ to: '/search', label: 'Browse listings instead' }}
                />
            </section>
        </>
    );
}
