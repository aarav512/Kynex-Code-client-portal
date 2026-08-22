import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { FolderKanban } from 'lucide-react';
import { NewProjectButton } from './NewProjectButton';

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  start_date: string | null;
  due_date: string | null;
  updated_at: string;
  clients: { company_name: string };
};


export const runtime = 'edge';

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('*, clients!inner(company_name)')
    .order('updated_at', { ascending: false });

  const rows = (projects as ProjectRow[] | null) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="All client projects."
        action={<NewProjectButton />}
      />
      {rows.length > 0 ? (
        <DataTable<ProjectRow>
          columns={[
            {
              key: 'title',
              label: 'Project',
              render: (p) => (
                <Link href={`/admin/projects/${p.id}`} className="font-medium text-signal hover:text-signal-600">
                  {p.title}
                </Link>
              )
            },
            { key: 'company', label: 'Client', render: (p) => p.clients.company_name },
            { key: 'status', label: 'Status', render: (p) => <StatusPill status={p.status} /> },
            { key: 'start_date', label: 'Start', render: (p) => formatDate(p.start_date) },
            { key: 'due_date', label: 'Due', render: (p) => formatDate(p.due_date) },
            { key: 'updated_at', label: 'Updated', render: (p) => formatDate(p.updated_at) }
          ]}
          rows={rows}
        />
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project and assign it to a client."
          action={<NewProjectButton />}
        />
      )}
    </div>
  );
}
