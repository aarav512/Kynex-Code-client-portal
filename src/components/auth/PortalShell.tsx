'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/nav/Sidebar';
import { Topbar } from '@/components/nav/Topbar';
import { getBrowserSupabase } from '@/lib/supabase/client';

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
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.replace('/login');
        return;
      }

      const { data: row } = await supabase
        .from('profiles')
        .select('id, role, full_name, email')
        .eq('id', data.session.user.id)
        .maybeSingle();

      if (!row) {
        window.location.replace('/login');
        return;
      }

      if (role === 'admin' && row.role !== 'admin') {
        window.location.replace('/dashboard');
        return;
      }

      if (role === 'client' && row.role === 'admin') {
        window.location.replace('/admin/dashboard');
        return;
      }

      setProfile({ full_name: row.full_name, email: row.email });
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
