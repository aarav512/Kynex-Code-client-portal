'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { ArrowLeft } from 'lucide-react';

export default function AdminClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { loading, error, data } = usePortalData(async (supabase) => {
    const { data: client } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
    if (!client) return { client: null, projects: [], files: [], payments: [] };
    const [projects, files, payments] = await Promise.all([
      supabase.from('projects').select('*').eq('client_id', id).order('updated_at', { ascending: false }),
      supabase.from('files').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('client_id', id).order('created_at', { ascending: false })
    ]);
    return { client, projects: projects.data ?? [], files: files.data ?? [], payments: payments.data ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data?.client ? (
        <div className="space-y-6">
          <Link href="/admin/clients" className="flex items-center gap-1 text-sm text-ink-600"><ArrowLeft className="h-4 w-4" /> Back to clients</Link>
          <PageHeader title={data.client.company_name} description={`${data.client.contact_name} · ${data.client.email}`} action={<StatusPill status={data.client.status} />} />
          <p className="text-sm text-ink-600">Added {formatDate(data.client.created_at)}</p>
          {data.projects.map((p: { id: string; title: string; status: string }) => (
            <Link key={p.id} href={`/admin/projects/${p.id}`} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
              <span className="font-medium">{p.title}</span><StatusPill status={p.status} />
            </Link>
          ))}
          {data.payments.map((p: { id: string; description: string; amount: number; status: string }) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
              <span>{p.description} · {formatMoney(p.amount)}</span><StatusPill status={p.status} />
            </div>
          ))}
        </div>
      ) : data ? <p className="text-sm text-ink-600">Client not found.</p> : null}
    </PortalState>
  );
}
