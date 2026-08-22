'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';

export default function ClientAmcPage() {
  const { loading, error, data } = usePortalData(async (supabase, session) => {
    const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', session.user.id).maybeSingle();
    if (!profile?.client_id) return { linked: false, rows: [] as { id: string; plan_name: string; amount: number; status: string; end_date: string | null }[] };
    const { data: rows } = await supabase.from('amc_contracts').select('*').eq('client_id', profile.client_id).order('created_at', { ascending: false });
    return { linked: true, rows: rows ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data && !data.linked ? <EmptyState title="No client account linked" /> : data ? (
        <div className="space-y-6">
          <PageHeader title="AMC" description="Your maintenance contracts." />
          {data.rows.length ? data.rows.map((c) => (
            <div key={c.id} className="rounded-lg border border-line bg-paper p-4">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold">{c.plan_name}</p>
                <StatusPill status={c.status} />
              </div>
              <p className="mt-2 text-sm text-ink-600">{formatMoney(c.amount)} · ends {formatDate(c.end_date)}</p>
            </div>
          )) : <EmptyState title="No AMC contracts" />}
        </div>
      ) : null}
    </PortalState>
  );
}
