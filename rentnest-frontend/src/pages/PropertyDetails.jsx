import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import ImageGallery from '../components/property/ImageGallery';
import Icon from '../components/ui/Icon';
import { Alert, Badge, EmptyState, Field, Modal, Spinner } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import useFavorites from '../hooks/useFavorites';
import useAsync from '../hooks/useAsync';
import { useAuth, useToast } from '../context/contexts';
import { propertyApi, visitApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';
import { CITY_COORDINATES, INDIA_CENTRE } from '../lib/constants';
import {
    describeProperty,
    formatCurrency,
    formatDate,
    formatNumber,
    formatPhone,
    formatRelative,
    humanise,
    isAvailableNow,
} from '../lib/format';

/**
 * A single listing.
 *
 * This page is public now. It used to sit behind ProtectedRoute, which meant a
 * visitor had to create an account before they could see a single property -
 * and no search engine could index a listing at all. The owner's phone number
 * is still revealed only to signed-in users.
 */
export default function PropertyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { isAuthenticated, user, requireAuth } = useAuth();
    const { isFavorited, toggleFavorite } = useFavorites();

    const [contactRevealed, setContactRevealed] = useState(false);
    // The booking window is computed when the dialog opens, inside an event
    // handler - reading the clock during render is non-deterministic and React
    // flags it.
    const [visitWindow, setVisitWindow] = useState(null);

    const fetchProperty = useCallback(() => propertyApi.getById(id), [id]);
    const { data: property, loading, error: fetchError } = useAsync(`property:${id}`, fetchProperty);

    const notFound = fetchError?.response?.status === 404;
    const error = fetchError && !notFound
        ? toErrorMessage(fetchError, 'We could not load this listing.')
        : '';

    // Per-listing title and description, so a shared link previews correctly
    // and search engines index each property rather than one generic page.
    usePageMeta({
        title: property
            ? `${describeProperty(property)} in ${property.locality}, ${property.city}`
            : 'Property details',
        description: property
            ? `${describeProperty(property)} for rent at ${formatCurrency(
                  property.rentAmount,
              )} per month in ${property.locality}, ${property.city}. Zero brokerage, contact the owner directly.`
            : undefined,
    });

    const coordinates = useMemo(
        () => (property ? CITY_COORDINATES[property.city] ?? INDIA_CENTRE : INDIA_CENTRE),
        [property],
    );

    const openVisitDialog = () => {
        if (!isAuthenticated) {
            requireAuth({
                reason: 'Sign in to request a viewing',
                onSuccess: () => setVisitWindow(buildVisitWindow()),
            });
            return;
        }
        setVisitWindow(buildVisitWindow());
    };

    const revealContact = () => {
        if (!isAuthenticated) {
            requireAuth({
                reason: "Sign in to see the owner's contact details",
                onSuccess: () => setContactRevealed(true),
            });
            return;
        }
        setContactRevealed(true);
    };

    const share = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: property.title, url });
                return;
            }
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to your clipboard.');
        } catch {
            // The visitor dismissed the share sheet, or the clipboard is blocked.
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center" role="status">
                <Spinner className="h-8 w-8 text-brand-500" />
                <span className="sr-only">Loading listing</span>
            </div>
        );
    }

    if (notFound || (!loading && !error && !property)) {
        return (
            <div className="container-page py-20">
                <EmptyState
                    icon="search"
                    title="This listing is no longer available"
                    description="It may have been rented out or removed by the owner."
                    action={
                        <Link to="/search" className="btn-brand btn-md">
                            Browse other rentals
                        </Link>
                    }
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-page py-20">
                <Alert tone="error">{error}</Alert>
            </div>
        );
    }

    const isOwner = user?.id === property.owner?.id;
    const available = isAvailableNow(property);

    return (
        <div className="bg-ink-50 pb-24 lg:pb-12 dark:bg-ink-950">
            <div className="container-page py-6">
                {/* Breadcrumb doubles as a link back into the filtered search. */}
                <nav aria-label="Breadcrumb" className="mb-5 text-sm">
                    <ol className="flex flex-wrap items-center gap-1.5 text-ink-500 dark:text-ink-400">
                        <li>
                            <Link to="/" className="link-quiet">
                                Home
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li>
                            <Link to="/search" className="link-quiet">
                                Rentals
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li>
                            <Link
                                to={`/search?city=${encodeURIComponent(property.city)}`}
                                className="link-quiet"
                            >
                                {property.city}
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li className="font-medium text-ink-800 dark:text-ink-200">{property.locality}</li>
                    </ol>
                </nav>

                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap gap-2">
                            <Badge tone="brand" icon="wallet">
                                Zero brokerage
                            </Badge>
                            {property.verified ? (
                                <Badge tone="info" icon="shield">
                                    Verified listing
                                </Badge>
                            ) : null}
                            {available ? (
                                <Badge tone="success" icon="lightning">
                                    Available now
                                </Badge>
                            ) : null}
                            {property.negotiable ? <Badge tone="neutral">Rent negotiable</Badge> : null}
                        </div>

                        <h1 className="font-display text-3xl font-extrabold text-ink-900 sm:text-4xl dark:text-ink-50">
                            {property.title}
                        </h1>
                        <p className="mt-2 flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
                            <Icon name="pin" className="h-4 w-4 text-brand-500" />
                            {property.locality}, {property.city}
                            {property.createdAt ? (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <span>Posted {formatRelative(property.createdAt)}</span>
                                </>
                            ) : null}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button type="button" onClick={share} className="btn-secondary btn-sm">
                            <Icon name="share" className="h-4 w-4" />
                            Share
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleFavorite(property.id)}
                            aria-pressed={isFavorited(property.id)}
                            className="btn-secondary btn-sm"
                        >
                            <Icon
                                name="heart"
                                filled={isFavorited(property.id)}
                                className={`h-4 w-4 ${isFavorited(property.id) ? 'text-accent-500' : ''}`}
                            />
                            {isFavorited(property.id) ? 'Saved' : 'Save'}
                        </button>
                        {isOwner ? (
                            <Link to={`/property/${property.id}/edit`} className="btn-brand btn-sm">
                                <Icon name="edit" className="h-4 w-4" />
                                Edit
                            </Link>
                        ) : null}
                    </div>
                </div>

                <ImageGallery images={property.images} title={property.title} />

                <div className="mt-10 flex flex-col gap-10 lg:flex-row">
                    {/* ------------------------------------------------- Content */}
                    <div className="min-w-0 flex-1 space-y-10">
                        <section>
                            <h2 className="sr-only">Key details</h2>
                            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink-200 bg-ink-200 sm:grid-cols-4 dark:border-ink-800 dark:bg-ink-800">
                                <KeyFact
                                    icon="bed"
                                    label="Configuration"
                                    value={property.rooms ? `${property.rooms} BHK` : humanise(property.type)}
                                />
                                <KeyFact
                                    icon="ruler"
                                    label="Built-up area"
                                    value={`${formatNumber(property.squareFootage)} sq.ft`}
                                />
                                <KeyFact
                                    icon="home"
                                    label="Furnishing"
                                    value={humanise(property.furnishingStatus)}
                                />
                                <KeyFact
                                    icon="calendar"
                                    label="Available from"
                                    value={available ? 'Immediately' : formatDate(property.availableFrom)}
                                />
                            </dl>
                        </section>

                        <section className="border-b border-ink-200 pb-10 dark:border-ink-800">
                            <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">
                                About this property
                            </h2>
                            <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-600 dark:text-ink-300">
                                {property.description}
                            </p>

                            <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                                <DetailRow label="Property type" value={humanise(property.type)} />
                                <DetailRow
                                    label="Preferred tenants"
                                    value={humanise(property.tenantPreference) || 'Anyone'}
                                />
                                <DetailRow
                                    label="Security deposit"
                                    value={formatCurrency(property.depositAmount)}
                                />
                                <DetailRow
                                    label="Rent negotiable"
                                    value={property.negotiable ? 'Yes' : 'No'}
                                />
                            </dl>
                        </section>

                        {property.amenities?.length ? (
                            <section className="border-b border-ink-200 pb-10 dark:border-ink-800">
                                <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">
                                    What this place offers
                                </h2>
                                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {property.amenities.map((amenity) => (
                                        <li
                                            key={amenity}
                                            className="flex items-center gap-3 text-sm text-ink-700 dark:text-ink-200"
                                        >
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                                                <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />
                                            </span>
                                            {amenity}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ) : null}

                        <section>
                            <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">
                                Where you'll be
                            </h2>
                            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                                {property.locality}, {property.city}
                            </p>

                            <div className="relative z-0 mt-5 h-80 overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800">
                                <MapContainer
                                    center={coordinates}
                                    zoom={13}
                                    scrollWheelZoom={false}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
                                    />
                                    <Marker
                                        position={coordinates}
                                        icon={L.divIcon({
                                            html: '<span class="price-marker is-active">Here</span>',
                                            className: 'custom-div-icon',
                                            iconSize: [56, 26],
                                            iconAnchor: [28, 26],
                                        })}
                                    />
                                </MapContainer>
                            </div>
                            <p className="mt-2 text-xs text-ink-400">
                                The marker shows the locality. The owner will share the exact address when
                                they confirm your visit.
                            </p>
                        </section>
                    </div>

                    {/* ------------------------------------------------- Sidebar */}
                    <aside className="w-full lg:w-96 lg:shrink-0">
                        <div className="sticky top-24 space-y-4">
                            <div className="surface p-6">
                                <div className="flex items-end justify-between border-b border-ink-100 pb-5 dark:border-ink-800">
                                    <div>
                                        <p className="font-display text-3xl font-extrabold text-brand-600 dark:text-brand-300">
                                            {formatCurrency(property.rentAmount)}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                                            Per month
                                        </p>
                                    </div>
                                    {property.negotiable ? <Badge tone="neutral">Negotiable</Badge> : null}
                                </div>

                                <dl className="space-y-3 py-5 text-sm">
                                    <PriceRow
                                        label="Security deposit"
                                        value={formatCurrency(property.depositAmount)}
                                    />
                                    <PriceRow label="Brokerage" value="₹0" highlight />
                                    <PriceRow
                                        label="Available"
                                        value={available ? 'Immediately' : formatDate(property.availableFrom)}
                                    />
                                </dl>

                                {isOwner ? (
                                    <Alert tone="info">
                                        This is your listing. Tenants see the contact button here.
                                    </Alert>
                                ) : contactRevealed ? (
                                    <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-center dark:border-ink-700 dark:bg-ink-800">
                                        <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                                            Owner contact
                                        </p>
                                        <a
                                            href={`tel:${property.contactNumber}`}
                                            className="mt-2 block font-display text-xl font-bold text-ink-900 dark:text-ink-50"
                                        >
                                            {formatPhone(property.contactNumber)}
                                        </a>
                                        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                                            {property.owner?.name}
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={revealContact}
                                        className="btn-brand btn-lg w-full"
                                    >
                                        <Icon name="phone" className="h-4 w-4" />
                                        Get owner's number
                                    </button>
                                )}

                                {!isOwner ? (
                                    <button
                                        type="button"
                                        onClick={openVisitDialog}
                                        className="btn-secondary btn-md mt-3 w-full"
                                    >
                                        <Icon name="calendar" className="h-4 w-4" />
                                        Request a visit
                                    </button>
                                ) : null}

                                <p className="mt-4 text-center text-xs text-ink-400">
                                    You will never be charged brokerage on RentNest.
                                </p>
                            </div>

                            <div className="surface flex items-center gap-3 p-4">
                                <span
                                    aria-hidden="true"
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-display text-lg font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-200"
                                >
                                    {property.owner?.name?.charAt(0)?.toUpperCase() ?? 'O'}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
                                        {property.owner?.name ?? 'Property owner'}
                                    </p>
                                    <p className="text-xs text-ink-500 dark:text-ink-400">
                                        Listed directly by the owner
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Sticky action bar on phones, where the sidebar is far below the fold. */}
            {!isOwner ? (
                <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-ink-200 bg-white px-4 py-3 lg:hidden dark:border-ink-800 dark:bg-ink-900">
                    <div>
                        <p className="font-display text-lg font-extrabold text-brand-600 dark:text-brand-300">
                            {formatCurrency(property.rentAmount)}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                            Per month
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={openVisitDialog} className="btn-secondary btn-sm">
                            Book visit
                        </button>
                        <button type="button" onClick={revealContact} className="btn-brand btn-sm">
                            Contact owner
                        </button>
                    </div>
                </div>
            ) : null}

            <VisitRequestModal
                window={visitWindow}
                onClose={() => setVisitWindow(null)}
                property={property}
                onScheduled={() => {
                    setVisitWindow(null);
                    toast.success('Visit requested. The owner will confirm shortly.');
                    navigate('/visits');
                }}
            />
        </div>
    );
}

function KeyFact({ icon, label, value }) {
    return (
        <div className="bg-white px-4 py-4 text-center dark:bg-ink-900">
            <Icon name={icon} className="mx-auto mb-2 h-5 w-5 text-brand-500" />
            <dd className="font-display text-sm font-bold text-ink-900 dark:text-ink-50">{value}</dd>
            <dt className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">{label}</dt>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="flex items-center justify-between border-b border-ink-100 py-2 text-sm dark:border-ink-800">
            <dt className="text-ink-500 dark:text-ink-400">{label}</dt>
            <dd className="font-semibold text-ink-900 dark:text-ink-100">{value}</dd>
        </div>
    );
}

function PriceRow({ label, value, highlight }) {
    return (
        <div className="flex items-center justify-between">
            <dt className="text-ink-500 dark:text-ink-400">{label}</dt>
            <dd
                className={`font-bold ${
                    highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-900 dark:text-ink-100'
                }`}
            >
                {value}
            </dd>
        </div>
    );
}

/**
 * Visit request dialog.
 *
 * The visit API existed on the server from the start but nothing in the UI ever
 * called it, so the whole scheduling feature was unreachable.
 */
function buildVisitWindow() {
    // Mirrors the server rule: at least two hours' notice, at most 60 days out.
    return {
        min: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
        max: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 16),
    };
}

/**
 * Visit request dialog.
 *
 * The visit API existed on the server from the start but nothing in the UI ever
 * called it, so the whole scheduling feature was unreachable.
 */
function VisitRequestModal({ window: bookingWindow, onClose, property, onScheduled }) {
    const [visitDate, setVisitDate] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await visitApi.request({ propertyId: property.id, visitDate });
            onScheduled();
        } catch (requestError) {
            setError(toErrorMessage(requestError, 'We could not book that slot.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={Boolean(bookingWindow)}
            onClose={onClose}
            title="Request a visit"
            description={`${describeProperty(property ?? {})} in ${property?.locality ?? ''}`}
        >
            <form onSubmit={submit} className="space-y-4 px-6 py-6">
                {error ? <Alert tone="error">{error}</Alert> : null}

                <Field
                    label="Preferred date and time"
                    type="datetime-local"
                    required
                    min={bookingWindow?.min}
                    max={bookingWindow?.max}
                    value={visitDate}
                    onChange={(event) => setVisitDate(event.target.value)}
                    hint="Pick a slot at least two hours from now. The owner can confirm or propose another time."
                />

                <button type="submit" disabled={submitting || !visitDate} className="btn-brand btn-md w-full">
                    {submitting ? <Spinner className="h-4 w-4" /> : null}
                    Send request
                </button>
            </form>
        </Modal>
    );
}
