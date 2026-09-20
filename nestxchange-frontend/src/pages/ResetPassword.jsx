import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Alert, Field, Spinner } from '../components/ui/Primitives';
import usePageMeta from '../hooks/usePageMeta';
import { authApi } from '../api/endpoints';
import { toErrorMessage, toFieldErrors } from '../api/client';

/**
 * Where a password-reset email's link lands: /reset-password?token=...
 * Kept as its own page (not folded into AuthModal) since it has to work for
 * someone arriving fresh from their inbox, not someone already mid-session.
 */
export default function ResetPassword() {
    usePageMeta({ title: 'Reset your password' });

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [fieldError, setFieldError] = useState('');
    const [done, setDone] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setFormError('');
        setFieldError('');

        try {
            await authApi.resetPassword(token, password);
            setDone(true);
        } catch (error) {
            const fields = toFieldErrors(error);
            setFieldError(fields.newPassword ?? '');
            setFormError(toErrorMessage(error, 'We could not reset your password. The link may have expired.'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
                <div className="surface max-w-sm p-6 text-center">
                    <p className="text-sm text-ink-600 dark:text-ink-300">
                        This link is missing its reset token. Request a new one from the sign-in form.
                    </p>
                    <Link to="/" className="btn-brand btn-md mt-5">
                        Back to home
                    </Link>
                </div>
            </div>
        );
    }

    if (done) {
        return (
            <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
                <div className="surface max-w-sm p-6 text-center">
                    <Alert tone="success">Your password has been reset. You can sign in with it now.</Alert>
                    <button type="button" onClick={() => navigate('/')} className="btn-brand btn-md mt-5 w-full">
                        Back to home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
            <div className="surface w-full max-w-sm p-6">
                <h1 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">Choose a new password</h1>
                <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                    {formError ? <Alert tone="error">{formError}</Alert> : null}
                    <Field
                        label="New password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        error={fieldError}
                        hint="At least 8 characters, with a letter and a number."
                    />
                    <button type="submit" disabled={submitting} className="btn-brand btn-md w-full">
                        {submitting ? <Spinner className="h-4 w-4" /> : null}
                        Reset password
                    </button>
                </form>
            </div>
        </div>
    );
}
