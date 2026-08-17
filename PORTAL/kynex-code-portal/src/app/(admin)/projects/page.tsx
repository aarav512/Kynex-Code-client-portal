import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataRow, DataCell } from '@/components/ui/DataTable';
import { StatusPill, PROJECT_STATUS_TONE } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { PROJECT_STATUS_LABEL, formatDate } from '@/lib/utils';

export default async function AdminProjectsPage() {
  const supabase = createClient();
  const { data: projects } = await supabase.from('projects')
    .select('*, clients(company_name)').order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader eyebrow="Projects" title="All projects"
        action={<Link href="/admin/projects/new" className="kx-btn-primary">New project</Link>} />
      {projects && projects.length > 0 ? (
        <DataTable columns={['Project', 'Client', 'Type', 'Status', 'Target', '']}>
          {projects.map((p: any) => (
            <DataRow key={p.id}>
              <DataCell className="font-medium">{p.name}</DataCell>
              <DataCell className="text-ink-600 text-sm">{p.clients?.company_name}</DataCell>
              <DataCell className="text-ink-600 text-sm">{p.project_type}</DataCell>
              <DataCell><StatusPill label={PROJECT_STATUS_LABEL[p.status]} tone={PROJECT_STATUS_TONE[p.status]} /></DataCell>
              <DataCell className="font-mono text-xs text-ink-600">{formatDate(p.expected_completion_date)}</DataCell>
              <DataCell><Link href={`/admin/projects/${p.id}`} className="text-sm text-signal hover:underline">Edit →</Link></DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No projects yet" description="Create a project and assign it to a client."
          action={<Link href="/admin/projects/new" className="kx-btn-primary">New project</Link>} />
      )}
    </div>
  );
}
