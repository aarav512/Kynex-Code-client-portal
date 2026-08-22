import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney, projectStatusLabel } from '@/lib/utils';
import Link from 'next/link';
import { FolderKanban, FileText, MessageSquare, CreditCard } from 'lucide-react';


export const runtime = 'edge';

export default async function ClientDashboard() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id, full_name')
    .eq('id', user!.id)
    .maybeSingle();

  const clientId = profile?.client_id;
  if (!clientId) {
    return (
      <EmptyState title="No client account linked" description="Please contact your account manager." />
    );
  }

  const [projects, files, requests, payments] = await Promise.all([
    supabase.from('projects').select('*').eq('client_id', clientId).order('updated_at', { ascending: false }).limit(5),
    supabase.from('files').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(5),
    supabase.from('requests').select('*').eq('client_id', clientId).order('updated_at', { ascending: false }).limit(5),
    supabase.from('payments').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(5)
  ]);

  const stats = [
    { label: 'Active Projects', value: projects.data?.filter(p => p.status === 'in_progress').length ?? 0, icon: FolderKanban, href: '/projects' },
    { label: 'Files', value: files.data?.length ?? 0, icon: FileText, href: '/files' },
    { label: 'Open Requests', value: requests.data?.filter(r => r.status === 'open' || r.status === 'in_progress').length ?? 0, icon: MessageSquare, href: '/requests' },
    { label: 'Pending Payments', value: payments.data?.filter(p => p.status === 'pending' || p.status === 'overdue').length ?? 0, icon: CreditCard, href: '/payments' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome, ${profile?.full_name?.split(' ')[0] || 'there'}`} description="Here's an overview of your account." />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-lg border border-line bg-paper p-4 transition-base hover:border-ink-600"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-paper-100">
              <stat.icon className="h-5 w-5 text-ink-600" />
            </div>
            <p className="font-display text-2xl font-semibold text-ink-900">{stat.value}</p>
            <p className="mt-1 text-xs text-ink-600">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">Recent Projects</h2>
          <Link href="/projects" className="text-sm text-signal transition-base hover:text-signal-600">
            View all →
          </Link>
        </div>
        {projects.data && projects.data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.data.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group rounded-lg border border-line bg-paper p-4 transition-base hover:border-ink-600"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-display font-semibold text-ink-900">{p.title}</h3>
                  <StatusPill status={p.status} />
                </div>
                <p className="text-sm text-ink-600 line-clamp-2">{p.description || 'No description'}</p>
                <p className="mt-3 text-xs text-ink-600">Updated {formatDate(p.updated_at)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={FolderKanban} title="No projects yet" description="Your projects will appear here once created." />
        )}
      </div>

      {/* Recent requests */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">Recent Requests</h2>
          <Link href="/requests" className="text-sm text-signal transition-base hover:text-signal-600">
            View all →
          </Link>
        </div>
        {requests.data && requests.data.length > 0 ? (
          <div className="space-y-2">
            {requests.data.map((r) => (
              <Link
                key={r.id}
                href={`/requests/${r.id}`}
                className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 transition-base hover:bg-paper-100"
              >
                <div>
                  <p className="font-medium text-ink-900">{r.subject}</p>
                  <p className="text-xs text-ink-600">{formatDate(r.updated_at)}</p>
                </div>
                <StatusPill status={r.status} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={MessageSquare} title="No requests yet" description="Submit a request and it will show up here." />
        )}
      </div>
    </div>
  );
}
