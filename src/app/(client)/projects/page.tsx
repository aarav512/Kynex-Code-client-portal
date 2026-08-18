import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { FolderKanban } from 'lucide-react';
import type { Project } from '@/lib/database.types';

export default async function ClientProjectsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('id', user!.id)
    .maybeSingle();

  if (!profile?.client_id) {
    return <EmptyState title="No client account linked" />;
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('updated_at', { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="All your projects with Kynex Code." />
      {projects && projects.length > 0 ? (
        <DataTable<Project>
          columns={[
            { key: 'title', label: 'Project', render: (p) => (
              <Link href={`/projects/${p.id}`} className="font-medium text-signal hover:text-signal-600">
                {p.title}
              </Link>
            )},
            { key: 'status', label: 'Status', render: (p) => <StatusPill status={p.status} /> },
            { key: 'start_date', label: 'Start', render: (p) => formatDate(p.start_date) },
            { key: 'due_date', label: 'Due', render: (p) => formatDate(p.due_date) },
            { key: 'updated_at', label: 'Updated', render: (p) => formatDate(p.updated_at) }
          ]}
          rows={projects as Project[]}
          onRowClick={(p) => {}}
        />
      ) : (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Your projects will appear here once created." />
      )}
    </div>
  );
}
