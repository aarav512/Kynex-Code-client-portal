'use client';

import { useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';

export default function RootPage() {
  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.replace('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .maybeSingle();
      window.location.replace(profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    });
  }, []);

  return <p className="p-8 text-sm text-ink-600">Loading…</p>;
}
