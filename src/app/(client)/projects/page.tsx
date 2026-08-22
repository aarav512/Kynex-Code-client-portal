'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import Link from 'next/link';
import { FolderKanban } from 'lucide-react';
import type { Project } from '@/lib/database.types';

export default function ClientProjectsPage() {
  const { loading, error, data } = usePortalData(async (supabase, session) => {
    const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', session.user.id).maybeSingle();
    if (!profile?.client_id) return { clientId: null, projects: [] as Project[] };
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', profile.client_id)
      .order('updated_at', { ascending: false });
    return { clientId: profile.client_id, projects: (projects as Project[]) ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data && !data.clientId ? (
        <EmptyState title="No client account linked" />
      ) : data ? (
        <div className="space-y-6">
          <PageHeader title="Projects" description="All your projects with Kynex Code." />
          {data.projects.length > 0 ? (
            <div className="space-y-2">
              {data.projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 hover:bg-paper-100">
                  <span className="font-medium text-ink-900">{p.title}</span>
                  <span className="text-xs text-ink-600">{formatDate(p.updated_at)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={FolderKanban} title="No projects yet" description="Your projects will appear here once created." />
          )}
        </div>
      ) : null}
    </PortalState>
  );
}
