import { useEffect, useState } from 'react';

import Icon from '../ui/Icon';
import { Alert, Field, Spinner } from '../ui/Primitives';
import { listingApi } from '../../api/endpoints';
import { toErrorMessage } from '../../api/client';
import { formatDateTime } from '../../lib/format';

/**
 * Two faces of the same feature: a non-owner sees a "contact the owner" form
 * (POST /listings/{id}/inquiries), the owner sees who has inquired
 * (GET /listings/{id}/inquiries, 403 for anyone else - enforced server-side,
 * this component just doesn't bother rendering that request for a non-owner).
 * Deliberately separate from the REQUEST state-machine event: an inquiry is
 * a message, not a commitment, and doesn't touch the listing's status.
 */
export default function ListingInquiryPanel({ listingId, isOwner, isAuthenticated, requireAuth }) {
    const [inquiries, setInquiries] = useState(null);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        if (!isOwner) return;
        listingApi
            .inquiriesReceived(listingId)
            .then(setInquiries)
            .catch((error) => setLoadError(toErrorMessage(error, 'Could not load inquiries.')));
    }, [listingId, isOwner]);

    if (isOwner) {
        return (
            <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                    Inquiries
                </h2>
                {loadError ? (
                    <Alert tone="error">{loadError}</Alert>
                ) : !inquiries ? (
                    <Spinner className="h-5 w-5 text-brand-500" />
                ) : inquiries.length === 0 ? (
                    <p className="text-sm text-ink-400">No one has inquired about this listing yet.</p>
                ) : (
                    <ul className="space-y-4">
                        {inquiries.map((inquiry) => (
                            <li key={inquiry.id} className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800/60">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                                        {inquiry.senderName}
                                    </p>
                                    <p className="text-xs text-ink-400">{formatDateTime(inquiry.createdAt)}</p>
                                </div>
                                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{inquiry.message}</p>
                                {inquiry.senderEmail ? (
                                    <a
                                        href={`mailto:${inquiry.senderEmail}`}
                                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
                                    >
                                        <Icon name="mail" className="h-3.5 w-3.5" />
                                        Reply to {inquiry.senderEmail}
                                    </a>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    return <SendInquiryForm listingId={listingId} isAuthenticated={isAuthenticated} requireAuth={requireAuth} />;
}

function SendInquiryForm({ listingId, isAuthenticated, requireAuth }) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const submit = (event) => {
        event.preventDefault();

        const doSend = () => {
            setSending(true);
            setError('');
            listingApi
                .sendInquiry(listingId, message)
                .then(() => {
                    setSent(true);
                    setMessage('');
                })
                .catch((requestError) => setError(toErrorMessage(requestError, 'Could not send your message.')))
                .finally(() => setSending(false));
        };

        if (!isAuthenticated) {
            requireAuth({ reason: 'Sign in to contact the owner', onSuccess: doSend });
            return;
        }
        doSend();
    };

    return (
        <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Contact the owner
            </h2>

            {error ? (
                <div className="mb-3">
                    <Alert tone="error" onDismiss={() => setError('')}>
                        {error}
                    </Alert>
                </div>
            ) : null}

            {sent ? (
                <Alert tone="success">Your message has been sent. The owner can reply by email.</Alert>
            ) : (
                <form onSubmit={submit} className="space-y-3">
                    <Field
                        as="textarea"
                        label="Message"
                        rows={3}
                        required
                        minLength={5}
                        maxLength={2000}
                        placeholder="Hi, is this still available? I'd like to know more..."
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                    />
                    <button type="submit" disabled={sending} className="btn-brand btn-md">
                        {sending ? 'Sending…' : 'Send message'}
                        <Icon name="mail" className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                </form>
            )}
        </div>
    );
}
