import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import Icon from '../ui/Icon';
import { Spinner } from '../ui/Primitives';
import { assistantApi } from '../../api/endpoints';
import { toErrorMessage } from '../../api/client';
import { useAuth } from '../../context/contexts';
import { formatCurrency, humanise } from '../../lib/format';

const STARTER_PROMPTS = [
    'Find me a 2BHK apartment to rent under 30k',
    'Show cars to buy under 10 lakh',
    'How does renting through NestXchange work?',
];

/**
 * The floating chat entry point, mounted once globally (see App.jsx). Gated
 * behind sign-in on the backend (every call may spend LLM API credit), so an
 * anonymous click opens the sign-in prompt instead of the panel - the same
 * `requireAuth` pattern used everywhere else in the app, not a special case.
 *
 * Positioned above the toast viewport's bottom-right corner (both anchor
 * there) rather than sharing it, so a toast notification never overlaps the
 * launcher button.
 */
export default function AssistantWidget() {
    const { isAuthenticated, requireAuth } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, sending]);

    const handleOpen = () => {
        if (!isAuthenticated) {
            requireAuth({ reason: 'Sign in to chat with the NestXchange assistant', onSuccess: () => setOpen(true) });
            return;
        }
        setOpen(true);
    };

    const send = (text) => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;

        const history = messages.map(({ role, content }) => ({ role, content }));
        const nextMessages = [...messages, { role: 'user', content: trimmed }];
        setMessages(nextMessages);
        setInput('');
        setSending(true);
        setError('');

        assistantApi
            .chat(trimmed, history)
            .then((response) => {
                setMessages((current) => [
                    ...current,
                    { role: 'assistant', content: response.reply, listings: response.listings },
                ]);
            })
            .catch((requestError) => setError(toErrorMessage(requestError, 'The assistant could not respond just now.')))
            .finally(() => setSending(false));
    };

    const submit = (event) => {
        event.preventDefault();
        send(input);
    };

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                aria-label={open ? 'Close assistant chat' : 'Open assistant chat'}
                className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lift transition-transform hover:scale-105 active:scale-95"
            >
                <Icon name={open ? 'close' : 'robot'} className="h-6 w-6" strokeWidth={2} />
            </button>

            {open ? (
                <div className="fixed bottom-40 right-6 z-40 flex h-[32rem] max-h-[70vh] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-lift dark:border-ink-700 dark:bg-ink-900">
                    <div className="flex items-center gap-2.5 border-b border-ink-100 bg-brand-500 px-4 py-3 text-white dark:border-ink-800">
                        <Icon name="robot" className="h-5 w-5" strokeWidth={2} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">NestXchange assistant</p>
                            <p className="truncate text-[11px] text-white/80">Ask about listings or how the platform works</p>
                        </div>
                        <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/15">
                            <Icon name="close" className="h-4 w-4" strokeWidth={2.5} />
                            <span className="sr-only">Close</span>
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scrollbar-slim p-4">
                        {messages.length === 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Try asking</p>
                                {STARTER_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => send(prompt)}
                                        className="block w-full rounded-lg border border-ink-200 px-3 py-2 text-left text-xs text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-ink-700 dark:text-ink-300 dark:hover:text-brand-300"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        {messages.map((message, index) => (
                            <ChatBubble key={index} message={message} />
                        ))}

                        {sending ? (
                            <div className="flex items-center gap-2 text-xs text-ink-400">
                                <Spinner className="h-3.5 w-3.5" />
                                Thinking…
                            </div>
                        ) : null}

                        {error ? <p className="text-xs text-accent-600 dark:text-accent-400">{error}</p> : null}
                    </div>

                    <form onSubmit={submit} className="flex items-center gap-2 border-t border-ink-100 p-3 dark:border-ink-800">
                        <input
                            type="text"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Ask something…"
                            maxLength={1000}
                            className="field flex-1"
                        />
                        <button
                            type="submit"
                            disabled={sending || !input.trim()}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Icon name="send" className="h-4 w-4" strokeWidth={2} />
                            <span className="sr-only">Send</span>
                        </button>
                    </form>
                </div>
            ) : null}
        </>
    );
}

function ChatBubble({ message }) {
    const isUser = message.role === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%]">
                <div
                    className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        isUser
                            ? 'bg-brand-500 text-white'
                            : 'bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100'
                    }`}
                >
                    {message.content}
                </div>

                {message.listings?.length > 0 ? (
                    <div className="mt-2 space-y-1.5">
                        {message.listings.map((listing) => (
                            <Link
                                key={listing.id}
                                to={`/listings/${listing.id}`}
                                className="block rounded-lg border border-ink-200 p-2 text-xs transition-colors hover:border-brand-400 dark:border-ink-700"
                            >
                                <p className="font-semibold text-ink-900 dark:text-ink-50">{listing.title}</p>
                                <p className="text-ink-500 dark:text-ink-400">
                                    {formatCurrency(listing.price)} · {listing.location} · {humanise(listing.category)}
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
