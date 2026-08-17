'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { requestPasswordReset, type ActionState } from '@/actions/auth';

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(requestPasswordReset, null);

  return (
    <div>
      <p className="kx-eyebrow mb-2">Reset password</p>
      <h1 className="font-display text-2xl font-medium text-ink-950">Reset your password</h1>
      <p className="mt-2 text-sm text-ink-600">
        Enter the email on your account and we'll send a link to set a new password.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label className="kx-label" htmlFor="email">
            Email
          </label>
          <input className="kx-input" id="email" name="email" type="email" autoComplete="email" required />
        </div>

        {state?.error && <p className="text-sm text-rust">{state.error}</p>}

        <button type="submit" className="kx-btn-primary w-full" disabled={pending}>
          {pending ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <Link href="/login" className="mt-5 inline-block text-sm text-ink-600 underline underline-offset-2">
        Back to sign in
      </Link>
    </div>
  );
}
