'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/nav/Sidebar';
import { Topbar } from '@/components/nav/Topbar';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { restoreKynexSession } from '@/lib/supabase/persist';

export function PortalShell({
  role,
  children
}: {
  role: 'admin' | 'client';
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();

    restoreKynexSession(supabase).then(async (session) => {
      if (!session) {
        window.location.replace('/login');
        return;
      }

      const { data: row } = await supabase
        .from('profiles')
        .select('id, role, full_name, email')
        .eq('id', session.user.id)
        .maybeSingle();

      if (row?.role === 'admin' && role === 'client') {
        window.location.replace('/admin/dashboard');
        return;
      }

      if (row?.role === 'client' && role === 'admin') {
        window.location.replace('/dashboard');
        return;
      }

      setProfile({
        full_name: row?.full_name || session.user.email || 'User',
        email: row?.email || session.user.email || ''
      });
    });
  }, [role]);

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-ink-600">
        Loading portal…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar userName={profile.full_name} userEmail={profile.email} role={role} />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
