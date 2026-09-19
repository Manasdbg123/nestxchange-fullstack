import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import Icon from '../components/ui/Icon';
import { Alert, Badge, EmptyState, Spinner } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import useAsync from '../hooks/useAsync';
import { useToast } from '../context/contexts';
import { visitApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';
import { VISIT_STATUS_LABELS } from '../lib/constants';
import { formatCurrency, formatDateTime, formatPhone } from '../lib/format';

const STATUS_TONES = {
    PENDING: 'warning',
    ACCEPTED: 'success',
    REJECTED: 'accent',
    EXPIRED: 'neutral',
};

/**
 * Site visits, from both sides.
 *
 * The backend has shipped a complete visit-scheduling feature since the start -
 * entity, service, controller, an async notification listener and a nightly job
 * that expires stale requests. None of it had any user interface, so none of it
 * was reachable. This page is that interface.
 */
export default function Visits() {
    usePageMeta({ title: 'Site visits' });

    const toast = useToast();
    const [tab, setTab] = useState('requested');
    const [actioning, setActioning] = useState(null);

    const fetchVisits = useCallback(
        () => Promise.all([visitApi.mine(), visitApi.forMyListings(false)]),
        [],
    );
    const { data, loading, error: fetchError, mutate } = useAsync('visits', fetchVisits);

    const [requested, received] = data ?? [[], []];
    const error = fetchError ? toErrorMessage(fetchError, 'We could not load your visits.') : '';

    const decide = async (visitId, status) => {
        setActioning(visitId);
        try {
            const updated = await visitApi.setStatus(visitId, status);
            mutate(([mine, forListings]) => [
                mine,
                forListings.map((visit) => (visit.id === visitId ? updated : visit)),
            ]);
            toast.success(status === 'ACCEPTED' ? 'Visit confirmed.' : 'Visit declined.');
        } catch (requestError) {
            toast.error(toErrorMessage(requestError, 'We could not update that request.'));
        } finally {
            setActioning(null);
        }
    };

    const withdraw = async (visitId) => {
        setActioning(visitId);
        try {
            await visitApi.cancel(visitId);
            mutate(([mine, forListings]) => [mine.filter((visit) => visit.id !== visitId), forListings]);
            toast.success('Request withdrawn.');
        } catch (requestError) {
            toast.error(toErrorMessage(requestError, 'We could not withdraw that request.'));
        } finally {
            setActioning(null);
        }
    };

    const pendingCount = received.filter((visit) => visit.status === 'PENDING').length;
    const visits = tab === 'requested' ? requested : received;

    return (
        <div className="bg-ink-50 py-10 dark:bg-ink-950">
            <div className="container-page max-w-4xl">
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                        Site visits
                    </h1>
                    <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                        Viewings you have asked for, and requests on the properties you own.
                    </p>
                </div>

                <div className="mb-6 flex gap-2 border-b border-ink-200 dark:border-ink-800" role="tablist">
                    {[
                        { id: 'requested', label: 'My requests', count: requested.length },
                        { id: 'received', label: 'Requests for my listings', count: pendingCount },
                    ].map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            role="tab"
                            aria-selected={tab === option.id}
                            onClick={() => setTab(option.id)}
                            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                                tab === option.id
                                    ? 'border-brand-500 text-brand-600 dark:text-brand-300'
                                    : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-200'
                            }`}
                        >
                            {option.label}
                            {option.count > 0 ? (
                                <span className="rounded-full bg-accent-500 px-1.5 text-[10px] font-bold text-white">
                                    {option.count}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                {error ? <Alert tone="error">{error}</Alert> : null}

                {loading ? (
                    <div className="flex justify-center py-16" role="status">
                        <Spinner className="h-7 w-7 text-brand-500" />
                        <span className="sr-only">Loading visits</span>
                    </div>
                ) : visits.length === 0 ? (
                    <EmptyState
                        icon="calendar"
                        title={
                            tab === 'requested'
                                ? 'You have not requested any visits'
                                : 'No one has requested a visit yet'
                        }
                        description={
                            tab === 'requested'
                                ? 'Find a property you like and request a viewing slot that suits you.'
                                : 'Requests from interested tenants will appear here as soon as they come in.'
                        }
                        action={
                            <Link
                                to={tab === 'requested' ? '/search' : '/my-properties'}
                                className="btn-brand btn-md"
                            >
                                {tab === 'requested' ? 'Browse rentals' : 'View my listings'}
                            </Link>
                        }
                    />
                ) : (
                    <ul className="space-y-4">
                        {visits.map((visit) => (
                            <li key={visit.id} className="surface p-5">
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <Link
                                        to={`/property/${visit.property?.id}`}
                                        className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-ink-100 sm:w-32 dark:bg-ink-800"
                                    >
                                        {visit.property?.imageUrl ? (
                                            <img
                                                src={visit.property.imageUrl}
                                                alt=""
                                                loading="lazy"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : null}
                                    </Link>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <Link
                                                    to={`/property/${visit.property?.id}`}
                                                    className="truncate font-display text-base font-bold text-ink-900 hover:text-brand-600 dark:text-ink-50 dark:hover:text-brand-300"
                                                >
                                                    {visit.property?.title}
                                                </Link>
                                                <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
                                                    {visit.property?.locality}, {visit.property?.city} ·{' '}
                                                    {formatCurrency(visit.property?.rentAmount)}
                                                </p>
                                            </div>

                                            <Badge tone={STATUS_TONES[visit.status] ?? 'neutral'}>
                                                {VISIT_STATUS_LABELS[visit.status] ?? visit.status}
                                            </Badge>
                                        </div>

                                        <p className="mt-3 flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
                                            <Icon name="clock" className="h-4 w-4 text-brand-500" />
                                            {formatDateTime(visit.visitDate)}
                                        </p>

                                        {/* Visitor contact reaches the owner only. */}
                                        {visit.visitor ? (
                                            <div className="mt-3 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 dark:border-ink-700 dark:bg-ink-800/50">
                                                <p className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                                                    Requested by
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-ink-50">
                                                    {visit.visitor.name}
                                                </p>
                                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
                                                    {visit.visitor.phone ? (
                                                        <a
                                                            href={`tel:${visit.visitor.phone}`}
                                                            className="link-quiet"
                                                        >
                                                            {formatPhone(visit.visitor.phone)}
                                                        </a>
                                                    ) : null}
                                                    <a
                                                        href={`mailto:${visit.visitor.email}`}
                                                        className="link-quiet"
                                                    >
                                                        {visit.visitor.email}
                                                    </a>
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {tab === 'received' && visit.status === 'PENDING' ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => decide(visit.id, 'ACCEPTED')}
                                                        disabled={actioning === visit.id}
                                                        className="btn-brand btn-sm"
                                                    >
                                                        {actioning === visit.id ? (
                                                            <Spinner className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <Icon
                                                                name="check"
                                                                className="h-3.5 w-3.5"
                                                                strokeWidth={2.5}
                                                            />
                                                        )}
                                                        Confirm visit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => decide(visit.id, 'REJECTED')}
                                                        disabled={actioning === visit.id}
                                                        className="btn-secondary btn-sm"
                                                    >
                                                        Decline
                                                    </button>
                                                </>
                                            ) : null}

                                            {tab === 'requested' && visit.status === 'PENDING' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => withdraw(visit.id)}
                                                    disabled={actioning === visit.id}
                                                    className="btn-secondary btn-sm"
                                                >
                                                    {actioning === visit.id ? (
                                                        <Spinner className="h-3.5 w-3.5" />
                                                    ) : null}
                                                    Withdraw request
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
