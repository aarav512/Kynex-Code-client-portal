'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';

export default function ClientPaymentsPage() {
  const { loading, error, data } = usePortalData(async (supabase, session) => {
    const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', session.user.id).maybeSingle();
    if (!profile?.client_id) return { linked: false, rows: [] as { id: string; description: string; amount: number; status: string; due_date: string | null }[] };
    const { data: rows } = await supabase.from('payments').select('*').eq('client_id', profile.client_id).order('created_at', { ascending: false });
    return { linked: true, rows: rows ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data && !data.linked ? <EmptyState title="No client account linked" /> : data ? (
        <div className="space-y-6">
          <PageHeader title="Payments" description="Invoices and payment status." />
          {data.rows.length ? data.rows.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
              <div>
                <p className="font-medium">{p.description}</p>
                <p className="text-xs text-ink-600">{formatMoney(p.amount)} · due {formatDate(p.due_date)}</p>
              </div>
              <StatusPill status={p.status} />
            </div>
          )) : <EmptyState title="No payments yet" />}
        </div>
      ) : null}
    </PortalState>
  );
}
