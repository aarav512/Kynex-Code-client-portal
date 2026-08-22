'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { NewAmcButton } from './NewAmcButton';

export default function AdminAmcPage() {
  const { loading, error, data } = usePortalData(async (supabase) => {
    const { data: contracts } = await supabase.from('amc_contracts').select('*, clients!inner(company_name)').order('created_at', { ascending: false });
    return { rows: (contracts as { id: string; plan_name: string; amount: number; status: string; end_date: string | null; clients: { company_name: string } }[] | null) ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data ? (
        <div className="space-y-6">
          <PageHeader title="AMC Contracts" description="Annual Maintenance Contracts for all clients." action={<NewAmcButton />} />
          {data.rows.length ? data.rows.map((c) => (
            <div key={c.id} className="rounded-lg border border-line bg-paper p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-semibold">{c.plan_name}</p>
                  <p className="text-xs text-ink-600">{c.clients.company_name}</p>
                </div>
                <StatusPill status={c.status} />
              </div>
              <p className="mt-2 text-sm text-ink-600">{formatMoney(c.amount)} · ends {formatDate(c.end_date)}</p>
            </div>
          )) : <EmptyState title="No AMC contracts" action={<NewAmcButton />} />}
        </div>
      ) : null}
    </PortalState>
  );
}
