'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn, type ActionState } from '@/actions/auth';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '';
  const [state, formAction, pending] = useActionState<ActionState, FormData>(signIn, null);

  return (
    <div>
      <p className="kx-eyebrow mb-2">Sign in</p>
      <h1 className="font-display text-2xl font-medium text-ink-950">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-600">Use the email and password your Kynex Code admin set up for you.</p>

      <form action={formAction} className="mt-8 space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <label className="kx-label" htmlFor="email">
            Email
          </label>
          <input className="kx-input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label className="kx-label" htmlFor="password">
            Password
          </label>
          <input
            className="kx-input"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {state?.error && <p className="text-sm text-rust">{state.error}</p>}

        <button type="submit" className="kx-btn-primary w-full" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <Link href="/forgot-password" className="mt-5 inline-block text-sm text-ink-600 underline underline-offset-2">
        Forgot your password?
      </Link>
    </div>
  );
}
