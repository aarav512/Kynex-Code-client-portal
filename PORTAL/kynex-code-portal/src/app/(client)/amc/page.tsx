import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill, AMC_STATUS_TONE } from '@/components/ui/StatusPill';
import { AMC_STATUS_LABEL, formatDate, formatMoney } from '@/lib/utils';

export default async function ClientAmcPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();

  const { data: amc } = await supabase
    .from('amc')
    .select('*')
    .eq('client_id', profile!.client_id!)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-xl">
      <PageHeader eyebrow="AMC" title="Annual Maintenance Contract" />
      {amc ? (
        <div className="space-y-6">
          <div className="kx-panel p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="kx-eyebrow mb-1.5">Plan</p>
                <h2 className="font-display text-xl font-medium">{amc.plan_name}</h2>
              </div>
              <StatusPill label={AMC_STATUS_LABEL[amc.status]} tone={AMC_STATUS_TONE[amc.status]} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-5 border-t border-line pt-5">
              {[
                { label: 'Amount', value: formatMoney(amc.amount, amc.currency) },
                { label: 'Start date', value: formatDate(amc.start_date) },
                { label: 'Renewal date', value: formatDate(amc.renewal_date) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="kx-eyebrow mb-1">{label}</p>
                  <p className="text-sm font-medium text-ink-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
          {amc.services_included.length > 0 && (
            <div className="kx-panel p-6">
              <p className="kx-eyebrow mb-4">Services included</p>
              <ul className="space-y-2">
                {amc.services_included.map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-sm text-ink-950">
                    <span className="mt-0.5 font-mono text-moss">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="kx-panel p-10 text-center">
          <p className="font-display text-lg font-medium text-ink-950">No Active AMC</p>
          <p className="mt-2 text-sm text-ink-600">
            Your account does not have an active Annual Maintenance Contract. Contact Kynex Code to learn more.
          </p>
        </div>
      )}
    </div>
  );
}
