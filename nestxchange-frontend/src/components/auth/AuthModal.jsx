import { useState } from 'react';

import { Alert, Field, Modal, Spinner } from '../ui/Primitives';
import Icon from '../ui/Icon';
import { useAuth } from '../../context/contexts';
import { useToast } from '../../context/contexts';
import { toErrorMessage, toFieldErrors } from '../../api/client';

/**
 * Sign in / sign up.
 *
 * Improvements over the previous dialog: it reports per-field validation errors
 * from the API instead of one generic line, it lets the visitor choose whether
 * they are renting or listing, it no longer reloads the page on success, and it
 * runs the caller's follow-up action so an interrupted task can continue.
 */
export default function AuthModal() {
    const { authPrompt, closeAuthPrompt, login, register } = useAuth();
    const toast = useToast();

    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        accountType: 'TENANT',
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const open = Boolean(authPrompt);
    const isLogin = mode === 'login';

    const close = () => {
        setFormError('');
        setFieldErrors({});
        closeAuthPrompt();
    };

    const update = (key) => (event) => {
        setForm((current) => ({ ...current, [key]: event.target.value }));
        setFieldErrors((current) => ({ ...current, [key]: undefined }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setFormError('');
        setFieldErrors({});

        try {
            if (isLogin) {
                await login({ email: form.email, password: form.password });
            } else {
                await register({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    phone: form.phone || undefined,
                    accountType: form.accountType,
                });
            }

            const followUp = authPrompt?.onSuccess;
            toast.success(isLogin ? 'Signed in successfully.' : 'Welcome to NestXchange.');
            close();
            followUp?.();
        } catch (error) {
            setFieldErrors(toFieldErrors(error));
            setFormError(toErrorMessage(error, 'We could not sign you in. Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={close}
            title={isLogin ? 'Sign in to NestXchange' : 'Create your free account'}
            description={authPrompt?.reason}
        >
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6" noValidate>
                {formError ? <Alert tone="error">{formError}</Alert> : null}

                {!isLogin ? (
                    <>
                        <Field
                            label="Full name"
                            required
                            autoComplete="name"
                            placeholder="Asha Menon"
                            value={form.name}
                            onChange={update('name')}
                            error={fieldErrors.name}
                        />

                        <fieldset>
                            <legend className="label">I am here to</legend>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'TENANT', label: 'Find a property or vehicle', icon: 'search' },
                                    { value: 'OWNER', label: 'List a property or vehicle', icon: 'tag' },
                                ].map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm font-semibold transition-colors ${
                                            form.accountType === option.value
                                                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                                                : 'border-ink-200 text-ink-600 hover:border-brand-300 dark:border-ink-700 dark:text-ink-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="accountType"
                                            className="sr-only"
                                            value={option.value}
                                            checked={form.accountType === option.value}
                                            onChange={update('accountType')}
                                        />
                                        <Icon name={option.icon} className="h-4 w-4" />
                                        {option.label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </>
                ) : null}

                <Field
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={update('email')}
                    error={fieldErrors.email}
                />

                <Field
                    label="Password"
                    type="password"
                    required
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={update('password')}
                    error={fieldErrors.password}
                    hint={isLogin ? undefined : 'At least 8 characters, with a letter and a number.'}
                />

                {!isLogin ? (
                    <Field
                        label="Mobile number"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="9876543210"
                        value={form.phone}
                        onChange={update('phone')}
                        error={fieldErrors.phone}
                        hint="Optional. Shared with owners only when you request a visit."
                    />
                ) : null}

                <button type="submit" disabled={submitting} className="btn-brand btn-md w-full">
                    {submitting ? <Spinner className="h-4 w-4" /> : null}
                    {isLogin ? 'Sign in' : 'Create account'}
                </button>

                <p className="pt-2 text-center text-sm text-ink-500 dark:text-ink-400">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        type="button"
                        onClick={() => {
                            setMode(isLogin ? 'register' : 'login');
                            setFormError('');
                            setFieldErrors({});
                        }}
                        className="font-semibold text-accent-600 hover:underline dark:text-accent-400"
                    >
                        {isLogin ? 'Sign up free' : 'Sign in'}
                    </button>
                </p>
            </form>
        </Modal>
    );
}
