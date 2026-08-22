import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';
import type { AmcContract } from '@/lib/database.types';


export const runtime = 'edge';

export default async function ClientAmcPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('id', user!.id)
    .maybeSingle();

  if (!profile?.client_id) {
    return <EmptyState title="No client account linked" />;
  }

  const { data: contracts } = await supabase
    .from('amc_contracts')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Annual Maintenance" description="Your AMC contracts with Kynex Code." />
      {contracts && contracts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {contracts.map((c) => (
            <div key={c.id} className="rounded-lg border border-line bg-paper p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-moss-100">
                    <ShieldCheck className="h-5 w-5 text-moss" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-ink-900">{c.plan_name}</h3>
                    <p className="text-xs text-ink-600">{formatMoney(c.amount)}/year</p>
                  </div>
                </div>
                <StatusPill status={c.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-ink-600">Start</p>
                  <p className="font-medium text-ink-900">{formatDate(c.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-600">End</p>
                  <p className="font-medium text-ink-900">{formatDate(c.end_date)}</p>
                </div>
              </div>
              {c.notes && (
                <p className="mt-3 rounded-md bg-paper-100 px-3 py-2 text-sm text-ink-600">{c.notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ShieldCheck} title="No AMC contracts" description="You don't have any active maintenance contracts." />
      )}
    </div>
  );
}
