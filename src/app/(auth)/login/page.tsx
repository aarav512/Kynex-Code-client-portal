'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { signInAction } from '@/actions/auth';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-base hover:bg-signal-600 disabled:opacity-50"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '';
  const error = searchParams.get('error');

  return (
    <form action={signInAction} className="space-y-4">
      {redirectTo ? <input type="hidden" name="redirect" value={redirectTo} /> : null}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          autoFocus
          className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white placeholder-ink-600 transition-base focus:border-signal focus:outline-none"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">
          Password
        </label>
        <input
          type="password"
          name="password"
          required
          className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white placeholder-ink-600 transition-base focus:border-signal focus:outline-none"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="rounded-md border border-rust-100 bg-rust-100/20 px-3 py-2 text-sm text-rust">
          {error}
        </p>
      )}
      <SubmitButton />
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-xs text-ink-600 transition-base hover:text-paper"
        >
          Forgot your password?
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-600">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
