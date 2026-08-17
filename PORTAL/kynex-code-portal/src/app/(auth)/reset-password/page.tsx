'use client';

import { useActionState } from 'react';
import { updatePassword, type ActionState } from '@/actions/auth';

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updatePassword, null);

  return (
    <div>
      <p className="kx-eyebrow mb-2">Reset password</p>
      <h1 className="font-display text-2xl font-medium text-ink-950">Set a new password</h1>
      <p className="mt-2 text-sm text-ink-600">Choose a new password for your account.</p>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label className="kx-label" htmlFor="password">
            New password
          </label>
          <input className="kx-input" id="password" name="password" type="password" required minLength={8} />
        </div>
        <div>
          <label className="kx-label" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input className="kx-input" id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
        </div>

        {state?.error && <p className="text-sm text-rust">{state.error}</p>}

        <button type="submit" className="kx-btn-primary w-full" disabled={pending}>
          {pending ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </div>
  );
}
