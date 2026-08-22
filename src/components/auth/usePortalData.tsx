'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase/client';

export function usePortalData<T>(loader: (supabase: SupabaseClient, session: Session) => Promise<T>) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = getBrowserSupabase();

    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      if (!sessionData.session) {
        window.location.replace('/login');
        return;
      }
      try {
        const result = await loaderRef.current(supabase, sessionData.session);
        if (active) setData(result);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return { loading, error, data };
}

export function PortalState({
  loading,
  error,
  children
}: {
  loading: boolean;
  error: string | null;
  children: ReactNode;
}) {
  if (loading) return <p className="text-sm text-ink-600">Loading…</p>;
  if (error) return <p className="rounded-md border border-rust-100 bg-rust-100/20 px-3 py-2 text-sm text-rust">{error}</p>;
  return <>{children}</>;
}
