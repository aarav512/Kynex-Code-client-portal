'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '';
  const [error, setError] = useState<string | null>(searchParams.get('error'));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password, redirect: redirectTo })
      });
      const text = await res.text();
      let payload: { ok?: boolean; error?: string; next?: string } = {};
      try {
        payload = JSON.parse(text);
      } catch {
        setError(text.slice(0, 200) || 'Sign in failed');
        setLoading(false);
        return;
      }

      if (!res.ok || !payload.ok) {
        setError(payload.error || 'Sign in failed');
        setLoading(false);
        return;
      }

      const nextPath =
        payload.next?.startsWith('/') && !payload.next.startsWith('//')
          ? payload.next
          : '/dashboard';
      window.location.assign(nextPath);
    } catch {
      setError('Could not reach the server. Try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-base hover:bg-signal-600 disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
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
