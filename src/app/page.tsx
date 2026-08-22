'use client';

import { useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { loadKynexSession, resolvePortalRole, restoreKynexSession } from '@/lib/supabase/persist';

export default function RootPage() {
  useEffect(() => {
    const supabase = getBrowserSupabase();
    restoreKynexSession(supabase).then(async (session) => {
      if (!session) {
        window.location.replace('/login');
        return;
      }
      const storedRole = loadKynexSession()?.role;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, client_id')
        .eq('id', session.user.id)
        .maybeSingle();
      const role = storedRole || resolvePortalRole(profile);
      window.location.replace(role === 'admin' ? '/admin/dashboard' : '/dashboard');
    });
  }, []);

  return <p className="p-8 text-sm text-ink-600">Loading…</p>;
}
