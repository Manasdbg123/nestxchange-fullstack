import { useNavigate } from 'react-router-dom';

import {
    CtaBanner,
    Faq,
    HowItWorks,
    SectionHeading,
    StatStrip,
    Testimonials,
    ValueProps,
} from '../components/marketing/Sections';
import Icon from '../components/ui/Icon';
import usePageMeta from '../hooks/usePageMeta';
import { useAuth } from '../context/contexts';

/**
 * The owner acquisition landing page.
 *
 * This is the surface the project was missing entirely: somewhere to explain to
 * a property owner why they should list here, what it costs, and what happens
 * after they do. "Post free property ad" previously dropped an owner straight
 * into a bare form with no context at all.
 */
export default function ListYourProperty() {
    usePageMeta({
        title: 'List your property for rent, free',
        description:
            'Post your flat, house, PG or commercial space on NestXchange at no cost. Reach tenants directly, keep the brokerage, and manage viewings in one place.',
    });

    const navigate = useNavigate();
    const { isAuthenticated, requireAuth } = useAuth();

    const startPosting = () => {
        if (isAuthenticated) {
            navigate('/post-property');
            return;
        }
        requireAuth({
            reason: 'Create a free account to post your property',
            onSuccess: () => navigate('/post-property'),
        });
    };

    return (
        <>
            {/* ---------------------------------------------------------- Hero */}
            <section className="relative overflow-hidden bg-ink-900">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-20 -top-24 h-96 w-96 rounded-full bg-accent-500/25 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl"
                />

                <div className="container-page relative grid gap-12 py-20 sm:py-24 lg:grid-cols-2 lg:items-center">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white">
                            <Icon name="sparkles" className="h-3.5 w-3.5" strokeWidth={2.5} />
                            Free forever for owners
                        </span>

                        <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                            Rent out your property
                            <span className="block text-accent-400">without paying a broker</span>
                        </h1>

                        <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-300">
                            List in under ten minutes, get visit requests from genuine tenants, and deal with
                            them directly. No commission, no lock-in, no calls from agents.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <button type="button" onClick={startPosting} className="btn-primary btn-lg">
                                Start posting your ad
                                <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.5} />
                            </button>
                            <a href="#how-it-works" className="btn btn-lg border border-white/25 text-white hover:bg-white/10">
                                See how it works
                            </a>
                        </div>

                        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-300">
                            {['No brokerage', 'No listing fee', 'Unlimited properties'].map((point) => (
                                <li key={point} className="flex items-center gap-2">
                                    <Icon name="check" className="h-4 w-4 text-brand-300" strokeWidth={2.5} />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* A preview of the posting flow, so the ask is concrete. */}
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                        <p className="mb-5 text-sm font-semibold text-white">Posting takes three screens</p>
                        <ol className="space-y-4">
                            {[
                                { icon: 'home', label: 'Property details', hint: 'Type, size, locality' },
                                { icon: 'wallet', label: 'Rent and deposit', hint: 'Plus what you will negotiate on' },
                                { icon: 'photo', label: 'Photos and amenities', hint: 'Up to 12 photos' },
                            ].map((step) => (
                                <li
                                    key={step.label}
                                    className="flex items-center gap-4 rounded-xl bg-white/10 px-4 py-3.5"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                                        <Icon name={step.icon} className="h-5 w-5" />
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold text-white">
                                            {step.label}
                                        </span>
                                        <span className="block text-xs text-ink-300">{step.hint}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                        <button type="button" onClick={startPosting} className="btn-brand btn-md mt-6 w-full">
                            Post your property free
                        </button>
                    </div>
                </div>
            </section>

            {/* --------------------------------------------------------- Stats */}
            <section className="container-page py-14">
                <StatStrip
                    stats={[
                        { value: '₹0', label: 'To list, forever' },
                        { value: '10 min', label: 'To publish a listing' },
                        { value: '12', label: 'Photos per listing' },
                        { value: '1 month', label: 'Of rent you keep, not a broker' },
                    ]}
                />
            </section>

            {/* --------------------------------------------------- Why post here */}
            <section className="bg-white py-16 dark:bg-ink-950">
                <div className="container-page">
                    <SectionHeading
                        eyebrow="Why post on NestXchange"
                        title="Built for owners, not for agents"
                        description="Every part of the flow assumes you are the person who owns the place - because on NestXchange, you are."
                    />

                    <div className="mt-12">
                        <ValueProps
                            items={[
                                {
                                    icon: 'wallet',
                                    title: 'Keep the brokerage',
                                    description:
                                        'Owners typically hand a broker one month of rent. Here that money stays with you, on every tenancy.',
                                },
                                {
                                    icon: 'shield',
                                    title: 'No calls from brokers',
                                    description:
                                        'Your number is shown only to signed-in tenants viewing your listing, not published on an open page.',
                                },
                                {
                                    icon: 'users',
                                    title: 'Genuine visit requests',
                                    description:
                                        'Tenants request a specific slot through the app, so you get real intent rather than a stream of cold calls.',
                                },
                                {
                                    icon: 'edit',
                                    title: 'Edit or pause anytime',
                                    description:
                                        'Change the rent, update photos, mark the property rented, or take it offline - all from your dashboard.',
                                },
                                {
                                    icon: 'calendar',
                                    title: 'Viewings in one place',
                                    description:
                                        'Accept or decline visit requests from a single screen instead of tracking them across WhatsApp threads.',
                                },
                                {
                                    icon: 'sparkles',
                                    title: 'Get the verified badge',
                                    description:
                                        'Verified listings appear higher in filtered searches and get noticeably more tenant interest.',
                                },
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* --------------------------------------------------- How it works */}
            <section className="container-page py-16">
                <SectionHeading
                    eyebrow="The process"
                    title="Three steps from listing to tenant"
                    description="No sales call, no site visit from us, no paperwork before you start."
                />
                <div className="mt-12">
                    <HowItWorks
                        id="how-it-works"
                        steps={[
                            {
                                title: 'Post your listing',
                                description:
                                    'Fill in the property details, set your rent and deposit, and add photos. Your listing goes live immediately.',
                            },
                            {
                                title: 'Tenants get in touch',
                                description:
                                    'Interested tenants reveal your number and request a viewing slot. You accept the ones that suit you.',
                            },
                            {
                                title: 'Agree terms directly',
                                description:
                                    'Negotiate rent and deposit with the tenant yourself, then mark the property rented in one click.',
                            },
                        ]}
                    />
                </div>
            </section>

            {/* -------------------------------------------------- What you get */}
            <section className="bg-white py-16 dark:bg-ink-950">
                <div className="container-page">
                    <SectionHeading
                        eyebrow="What's included"
                        title="Everything, at no cost"
                        description="There is no paid tier. This is a portfolio project, so every feature is simply available to every owner."
                    />

                    <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800">
                        {[
                            'Unlimited property listings',
                            'Up to 12 photos per listing',
                            'Amenities, tenant preference and availability date',
                            'Direct tenant contact, no intermediary',
                            'Visit request management',
                            'Edit, pause or delete a listing at any time',
                        ].map((feature, index) => (
                            <div
                                key={feature}
                                className={`flex items-center gap-3 px-6 py-4 ${
                                    index % 2 === 0
                                        ? 'bg-white dark:bg-ink-900'
                                        : 'bg-ink-50 dark:bg-ink-900/50'
                                }`}
                            >
                                <Icon
                                    name="check"
                                    className="h-5 w-5 shrink-0 text-brand-500"
                                    strokeWidth={2.5}
                                />
                                <span className="text-sm text-ink-700 dark:text-ink-200">{feature}</span>
                                <span className="ml-auto text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                                    Included
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --------------------------------------------------- Testimonials */}
            <section className="container-page py-16">
                <SectionHeading eyebrow="From owners" title="How it has gone for others" />
                <div className="mt-12">
                    <Testimonials
                        items={[
                            {
                                name: 'Arun Prakash',
                                role: 'Owner',
                                city: 'Darbhanga',
                                quote:
                                    'Listing was free and took about ten minutes. Four genuine visit requests in the first week, and the flat was let out by the end of the month.',
                            },
                            {
                                name: 'Meera Nair',
                                role: 'Owner',
                                city: 'Madhubani',
                                quote:
                                    'What I liked most was not getting twenty broker calls the moment I posted. Only actual tenants reached me.',
                            },
                            {
                                name: 'Vikram Shah',
                                role: 'Owner',
                                city: 'Muzaffarpur',
                                quote:
                                    'I manage three properties and being able to pause a listing the moment it is rented, instead of fielding calls for weeks, is worth a lot.',
                            },
                        ]}
                    />
                </div>
            </section>

            {/* ----------------------------------------------------------- FAQ */}
            <section className="bg-white py-16 dark:bg-ink-950">
                <div className="container-page">
                    <SectionHeading eyebrow="Owner questions" title="Frequently asked questions" />
                    <div className="mt-10">
                        <Faq
                            items={[
                                {
                                    question: 'Is posting really free?',
                                    answer:
                                        'Yes. There is no listing fee, no commission and no paid tier. You can post as many properties as you like.',
                                },
                                {
                                    question: 'Who can see my phone number?',
                                    answer:
                                        'Only signed-in users who open your listing and choose to reveal it. It is never included in the public listings feed, and never shown to anonymous visitors.',
                                },
                                {
                                    question: 'What kinds of property can I list?',
                                    answer:
                                        'Apartments, independent houses, villas, studios, single rooms, PG and hostel accommodation, shops and commercial spaces.',
                                },
                                {
                                    question: 'Can I edit my listing after posting?',
                                    answer:
                                        'Yes. From "My listings" you can change any detail, mark the property as rented out, pause it temporarily, or delete it entirely.',
                                },
                                {
                                    question: 'How do I get the verified badge?',
                                    answer:
                                        'Our moderation team reviews new listings and adds the badge once the details and ownership check out. You do not need to do anything to request it.',
                                },
                                {
                                    question: 'What happens to my listing once the property is rented?',
                                    answer:
                                        'Mark it as rented out and it disappears from search results while staying in your dashboard, so you can relist it later without re-entering everything.',
                                },
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* ----------------------------------------------------------- CTA */}
            <section className="container-page pb-8">
                <CtaBanner
                    title="Ready to find your tenant?"
                    description="Post your property now and start receiving visit requests today. It costs nothing and takes about ten minutes."
                    primary={{ to: '/post-property', label: 'Post your property free' }}
                    secondary={{ to: '/search', label: 'See what else is listed' }}
                />
            </section>
        </>
    );
}
