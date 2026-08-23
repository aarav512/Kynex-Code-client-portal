'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import Link from 'next/link';

export default function AdminRequestsPage() {
  const { loading, error, data } = usePortalData(async (supabase) => {
    const { data: requests } = await supabase.from('requests').select('*').order('updated_at', { ascending: false });
    const { attachClientCompany } = await import('@/lib/clients-display');
    const rows = await attachClientCompany(supabase, (requests as { id: string; client_id?: string; subject?: string; title?: string; status: string; updated_at: string }[]) ?? []);
    return { rows: rows.map((row) => ({ ...row, subject: row.subject || row.title || 'Request' })) };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data ? (
        <div className="space-y-6">
          <PageHeader title="Requests" description="Support requests from all clients." />
          {data.rows.length ? data.rows.map((r) => (
            <Link key={r.id} href={`/admin/requests/${r.id}`} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
              <div>
                <p className="font-medium">{r.subject}</p>
                <p className="text-xs text-ink-600">{r.clients.company_name} · {formatDate(r.updated_at)}</p>
              </div>
              <StatusPill status={r.status} />
            </Link>
          )) : <EmptyState title="No requests yet" />}
        </div>
      ) : null}
    </PortalState>
  );
}
