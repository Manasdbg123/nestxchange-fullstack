import { useCallback } from 'react';
import { Link } from 'react-router-dom';

import Icon from '../components/ui/Icon';
import { Alert, EmptyState, Spinner } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import useAsync from '../hooks/useAsync';
import { listingApi } from '../api/endpoints';
import { toErrorMessage } from '../api/client';
import { formatDateTime } from '../lib/format';

/** Every inquiry the caller has sent, across every listing - see ListingInquiryPanel for the send side. */
export default function SentInquiries() {
    usePageMeta({ title: 'Your inquiries' });

    const fetchSent = useCallback(() => listingApi.inquiriesSent(), []);
    const { data, loading, error: fetchError } = useAsync('sent-inquiries', fetchSent);

    const inquiries = data ?? [];
    const error = fetchError ? toErrorMessage(fetchError, 'We could not load your inquiries.') : '';

    return (
        <div className="bg-ink-50 py-10 dark:bg-ink-950">
            <div className="container-page max-w-3xl">
                <h1 className="mb-8 font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                    Your inquiries
                </h1>

                {error ? (
                    <Alert tone="error">{error}</Alert>
                ) : loading ? (
                    <div className="flex justify-center py-16">
                        <Spinner className="h-8 w-8 text-brand-500" />
                    </div>
                ) : inquiries.length === 0 ? (
                    <EmptyState
                        icon="mail"
                        title="No inquiries sent yet"
                        description="Message a listing's owner from its detail page and it'll show up here."
                        action={
                            <Link to="/search" className="btn-brand btn-md">
                                Browse listings
                            </Link>
                        }
                    />
                ) : (
                    <ul className="space-y-3">
                        {inquiries.map((inquiry) => (
                            <li key={inquiry.id} className="surface p-4">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <Link
                                        to={`/listings/${inquiry.listingId}`}
                                        className="text-sm font-bold text-ink-900 hover:text-brand-600 dark:text-ink-50 dark:hover:text-brand-300"
                                    >
                                        {inquiry.listingTitle}
                                    </Link>
                                    <p className="text-xs text-ink-400">{formatDateTime(inquiry.createdAt)}</p>
                                </div>
                                <p className="mt-1.5 flex items-start gap-1.5 text-sm text-ink-600 dark:text-ink-300">
                                    <Icon name="mail" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    {inquiry.message}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
