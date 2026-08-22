'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { ArrowLeft } from 'lucide-react';

export default function ClientProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { loading, error, data } = usePortalData(async (supabase) => {
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
    return { project };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data?.project ? (
        <div className="space-y-6">
          <Link href="/projects" className="flex items-center gap-1 text-sm text-ink-600"><ArrowLeft className="h-4 w-4" /> Back</Link>
          <PageHeader title={data.project.title} description={data.project.description || undefined} action={<StatusPill status={data.project.status} />} />
          <p className="text-sm text-ink-600">Due {formatDate(data.project.due_date)} · {formatMoney(data.project.budget)}</p>
        </div>
      ) : data ? <p className="text-sm text-ink-600">Project not found.</p> : null}
    </PortalState>
  );
}
