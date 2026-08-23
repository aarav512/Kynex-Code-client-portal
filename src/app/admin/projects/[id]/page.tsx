'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { EditProjectButton } from './EditProjectButton';
import { ArrowLeft } from 'lucide-react';

export default function AdminProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { loading, error, data } = usePortalData(async (supabase) => {
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
    if (!project) return { project: null, company: '' };
    const { attachClientCompany } = await import('@/lib/clients-display');
    const [hydrated] = await attachClientCompany(supabase, [project as { id: string; client_id?: string }]);
    return { project, company: hydrated.clients.company_name };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data?.project ? (
        <div className="space-y-6">
          <Link href="/admin/projects" className="flex items-center gap-1 text-sm text-ink-600"><ArrowLeft className="h-4 w-4" /> Back</Link>
          <PageHeader title={data.project.title} description={data.company} action={<EditProjectButton project={data.project} />} />
          <StatusPill status={data.project.status} />
          <p className="text-sm text-ink-600">{data.project.description || 'No description'}</p>
        </div>
      ) : data ? <p className="text-sm text-ink-600">Project not found.</p> : null}
    </PortalState>
  );
}
