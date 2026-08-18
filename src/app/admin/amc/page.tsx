import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { ShieldCheck, Plus } from 'lucide-react';
import type { AmcContract } from '@/lib/database.types';
import { NewAmcButton } from './NewAmcButton';

export default async function AdminAmcPage() {
  const supabase = createClient();

  const { data: contracts } = await supabase
    .from('amc_contracts')
    .select('*, clients!inner(company_name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AMC Contracts"
        description="Annual Maintenance Contracts for all clients."
        action={<NewAmcButton />}
      />
      {contracts && contracts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {contracts.map((c) => {
            const contract = c as AmcContract & { clients: { company_name: string } };
            return (
              <div key={contract.id} className="rounded-lg border border-line bg-paper p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-moss-100">
                      <ShieldCheck className="h-5 w-5 text-moss" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-ink-900">{contract.plan_name}</h3>
                      <p className="text-xs text-ink-600">{contract.clients.company_name}</p>
                    </div>
                  </div>
                  <StatusPill status={contract.status} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-ink-600">Amount</p>
                    <p className="font-medium text-ink-900">{formatMoney(contract.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-600">Start</p>
                    <p className="font-medium text-ink-900">{formatDate(contract.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-600">End</p>
                    <p className="font-medium text-ink-900">{formatDate(contract.end_date)}</p>
                  </div>
                </div>
                {contract.notes && (
                  <p className="mt-3 rounded-md bg-paper-100 px-3 py-2 text-sm text-ink-600">{contract.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="No AMC contracts"
          description="Add your first Annual Maintenance Contract."
          action={<NewAmcButton />}
        />
      )}
    </div>
  );
}
