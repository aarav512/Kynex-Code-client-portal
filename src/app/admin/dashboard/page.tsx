import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate, formatMoney } from '@/lib/utils';
import Link from 'next/link';
import { Users, FolderKanban, MessageSquare, CreditCard, ShieldCheck, FileText } from 'lucide-react';


export default async function AdminDashboard() {
  const supabase = await createClient();

  const [clients, projects, requests, payments, files, amc] = await Promise.all([
    supabase.from('clients').select('*').order('created_at', { ascending: false }),
    supabase.from('projects').select('*').order('updated_at', { ascending: false }).limit(5),
    supabase.from('requests').select('*').order('updated_at', { ascending: false }).limit(5),
    supabase.from('payments').select('*').order('created_at', { ascending: false }),
    supabase.from('files').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('amc_contracts').select('*').eq('status', 'active')
  ]);

  const totalRevenue = payments.data?.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const outstanding = payments.data?.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const openRequests = requests.data?.filter(r => r.status === 'open' || r.status === 'in_progress').length ?? 0;

  const stats = [
    { label: 'Clients', value: clients.data?.length ?? 0, icon: Users, href: '/admin/clients' },
    { label: 'Projects', value: projects.data?.length ?? 0, icon: FolderKanban, href: '/admin/projects' },
    { label: 'Open Requests', value: openRequests, icon: MessageSquare, href: '/admin/requests' },
    { label: 'Active AMC', value: amc.data?.length ?? 0, icon: ShieldCheck, href: '/admin/amc' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Overview of all clients and activity." />

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

      {/* Revenue */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="text-xs text-ink-600">Total Revenue (Paid)</p>
          <p className="mt-1 font-display text-2xl font-semibold text-moss">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="text-xs text-ink-600">Outstanding</p>
          <p className="mt-1 font-display text-2xl font-semibold text-amber">{formatMoney(outstanding)}</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Recent Projects</h2>
          {projects.data && projects.data.length > 0 ? (
            <div className="space-y-2">
              {projects.data.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/projects/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 transition-base hover:bg-paper-100"
                >
                  <p className="font-medium text-ink-900">{p.title}</p>
                  <StatusPill status={p.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-sm text-ink-600">No projects yet.</p>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Recent Requests</h2>
          {requests.data && requests.data.length > 0 ? (
            <div className="space-y-2">
              {requests.data.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/requests/${r.id}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 transition-base hover:bg-paper-100"
                >
                  <p className="font-medium text-ink-900">{r.subject}</p>
                  <StatusPill status={r.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-sm text-ink-600">No requests yet.</p>
          )}
        </div>
      </div>

      {/* Recent clients */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">Clients</h2>
          <Link href="/admin/clients" className="text-sm text-signal transition-base hover:text-signal-600">View all →</Link>
        </div>
        {clients.data && clients.data.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clients.data.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/admin/clients/${c.id}`}
                className="group rounded-lg border border-line bg-paper p-4 transition-base hover:border-ink-600"
              >
                <p className="font-display font-semibold text-ink-900">{c.company_name}</p>
                <p className="mt-1 text-xs text-ink-600">{c.contact_name} · {c.email}</p>
                <div className="mt-2"><StatusPill status={c.status} /></div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-sm text-ink-600">No clients yet.</p>
        )}
      </div>
    </div>
  );
}
