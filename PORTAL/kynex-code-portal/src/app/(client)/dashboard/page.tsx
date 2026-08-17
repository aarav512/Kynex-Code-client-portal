import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PROJECT_STATUS_LABEL, REQUEST_STATUS_LABEL, formatDate } from '@/lib/utils';
import { StatusPill, PROJECT_STATUS_TONE, REQUEST_STATUS_TONE } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function ClientDashboardPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, client_id')
    .eq('id', user!.id)
    .single();

  const clientId = profile!.client_id!;

  const [{ data: client }, { data: projects }, { data: requests }, { data: files }, { data: invoices }, { data: amc }] =
    await Promise.all([
      supabase.from('clients').select('company_name').eq('id', clientId).single(),
      supabase.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase
        .from('requests')
        .select('id, title, status, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('files')
        .select('id, file_name, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(4),
      supabase.from('invoices').select('status').eq('client_id', clientId),
      supabase.from('amc').select('status, renewal_date').eq('client_id', clientId).maybeSingle()
    ]);

  const activeProject = (projects ?? []).find((p) => p.status !== 'completed') ?? projects?.[0] ?? null;
  const hasOverdue = (invoices ?? []).some((i) => i.status === 'overdue');
  const hasPending = (invoices ?? []).some((i) => i.status === 'pending');
  const paymentSummary = hasOverdue ? 'Overdue invoice' : hasPending ? 'Payment pending' : 'All paid up';

  return (
    <div>
      <p className="kx-eyebrow mb-2">Dashboard</p>
      <h1 className="font-display text-3xl font-medium text-ink-950">Welcome back, {profile!.full_name.split(' ')[0]}</h1>
      <p className="mt-1.5 text-sm text-ink-600">{client?.company_name}</p>

      {/* Primary project summary — the one thing a client opens this for */}
      <div className="kx-panel mt-8 p-6 md:p-8">
        {activeProject ? (
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="kx-eyebrow mb-2">Project</p>
              <h2 className="font-display text-xl font-medium text-ink-950">{activeProject.name}</h2>
              <div className="mt-3 flex items-center gap-3">
                <StatusPill
                  label={PROJECT_STATUS_LABEL[activeProject.status]}
                  tone={PROJECT_STATUS_TONE[activeProject.status]}
                />
                {activeProject.expected_completion_date && (
                  <span className="text-xs text-ink-600">
                    Target: {formatDate(activeProject.expected_completion_date)}
                  </span>
                )}
              </div>
            </div>
            {activeProject.live_url && (
              <a href={activeProject.live_url} target="_blank" rel="noreferrer" className="kx-btn-secondary">
                Visit website →
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-600">No project has been assigned to your account yet.</p>
        )}
      </div>

      {/* Quick status row */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="kx-panel p-5">
          <p className="kx-eyebrow mb-2">Payment status</p>
          <p className="font-display text-base font-medium text-ink-950">{paymentSummary}</p>
        </div>
        <div className="kx-panel p-5">
          <p className="kx-eyebrow mb-2">AMC status</p>
          <p className="font-display text-base font-medium text-ink-950">
            {amc ? amc.status.replace('_', ' ') : 'No Active AMC'}
          </p>
        </div>
        <div className="kx-panel p-5">
          <p className="kx-eyebrow mb-2">Open requests</p>
          <p className="font-display text-base font-medium text-ink-950">
            {(requests ?? []).filter((r) => r.status !== 'completed').length} open
          </p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="kx-eyebrow">Recent requests</p>
            <Link href="/requests" className="text-xs text-ink-600 underline underline-offset-2">
              View all
            </Link>
          </div>
          {requests && requests.length > 0 ? (
            <ul className="kx-panel divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-3">
                  <Link href={`/requests/${r.id}`} className="text-sm text-ink-950 hover:underline">
                    {r.title}
                  </Link>
                  <StatusPill label={REQUEST_STATUS_LABEL[r.status]} tone={REQUEST_STATUS_TONE[r.status]} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No requests yet" description="Submit a request when you need something changed." />
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="kx-eyebrow">Recently uploaded files</p>
            <Link href="/files" className="text-xs text-ink-600 underline underline-offset-2">
              View all
            </Link>
          </div>
          {files && files.length > 0 ? (
            <ul className="kx-panel divide-y divide-line">
              {files.map((f) => (
                <li key={f.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-ink-950">{f.file_name}</span>
                  <span className="font-mono text-xs text-ink-600">{formatDate(f.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No files yet" description="Files your Kynex Code team shares will show up here." />
          )}
        </section>
      </div>
    </div>
  );
}
