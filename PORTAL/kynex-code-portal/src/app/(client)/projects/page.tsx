import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusPill, PROJECT_STATUS_TONE } from '@/components/ui/StatusPill';
import { PROJECT_STATUS_LABEL, formatDate } from '@/lib/utils';

export default async function ClientProjectsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', profile!.client_id!)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader eyebrow="Projects" title="Your projects" />

      {projects && projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="kx-panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="kx-eyebrow mb-1.5">{p.project_type}</p>
                  <h2 className="font-display text-lg font-medium text-ink-950">{p.name}</h2>
                </div>
                <StatusPill label={PROJECT_STATUS_LABEL[p.status]} tone={PROJECT_STATUS_TONE[p.status]} />
              </div>

              {p.description && <p className="mt-3 max-w-2xl text-sm text-ink-700">{p.description}</p>}

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
                <div>
                  <p className="kx-eyebrow mb-1">Start date</p>
                  <p className="text-sm text-ink-950">{formatDate(p.start_date)}</p>
                </div>
                <div>
                  <p className="kx-eyebrow mb-1">Target date</p>
                  <p className="text-sm text-ink-950">{formatDate(p.expected_completion_date)}</p>
                </div>
                <div className="col-span-2">
                  <p className="kx-eyebrow mb-1">Live URL</p>
                  {p.live_url ? (
                    <a href={p.live_url} target="_blank" rel="noreferrer" className="text-sm text-signal underline underline-offset-2">
                      {p.live_url}
                    </a>
                  ) : (
                    <p className="text-sm text-ink-600">Not live yet</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No projects yet" description="Your Kynex Code team will assign a project to your account soon." />
      )}
    </div>
  );
}
