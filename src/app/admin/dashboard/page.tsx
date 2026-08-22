'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import Link from 'next/link';
import { Users, FolderKanban, MessageSquare, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { loading, error, data } = usePortalData(async (supabase) => {
    const [clients, projects, requests, payments, amc] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('updated_at', { ascending: false }).limit(5),
      supabase.from('requests').select('*').order('updated_at', { ascending: false }).limit(5),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('amc_contracts').select('*').eq('status', 'active')
    ]);
    return {
      clients: clients.data ?? [],
      projects: projects.data ?? [],
      requests: requests.data ?? [],
      payments: payments.data ?? [],
      amc: amc.data ?? []
    };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data ? <DashboardView {...data} /> : null}
    </PortalState>
  );
}

function DashboardView({
  clients,
  projects,
  requests,
  payments,
  amc
}: {
  clients: { id: string; company_name: string; contact_name: string; email: string; status: string }[];
  projects: { id: string; title: string; status: string }[];
  requests: { id: string; subject: string; status: string }[];
  payments: { amount: number | string; status: string }[];
  amc: unknown[];
}) {
  const totalRevenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = payments.filter((p) => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + Number(p.amount), 0);
  const openRequests = requests.filter((r) => r.status === 'open' || r.status === 'in_progress').length;
  const stats = [
    { label: 'Clients', value: clients.length, icon: Users, href: '/admin/clients' },
    { label: 'Projects', value: projects.length, icon: FolderKanban, href: '/admin/projects' },
    { label: 'Open Requests', value: openRequests, icon: MessageSquare, href: '/admin/requests' },
    { label: 'Active AMC', value: amc.length, icon: ShieldCheck, href: '/admin/amc' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Overview of all clients and activity." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group rounded-lg border border-line bg-paper p-4 transition-base hover:border-ink-600">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-paper-100">
              <stat.icon className="h-5 w-5 text-ink-600" />
            </div>
            <p className="font-display text-2xl font-semibold text-ink-900">{stat.value}</p>
            <p className="mt-1 text-xs text-ink-600">{stat.label}</p>
          </Link>
        ))}
      </div>
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
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Recent Projects</h2>
          {projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map((p) => (
                <Link key={p.id} href={`/admin/projects/${p.id}`} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 transition-base hover:bg-paper-100">
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
          {requests.length > 0 ? (
            <div className="space-y-2">
              {requests.map((r) => (
                <Link key={r.id} href={`/admin/requests/${r.id}`} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 transition-base hover:bg-paper-100">
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
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">Clients</h2>
          <Link href="/admin/clients" className="text-sm text-signal transition-base hover:text-signal-600">View all →</Link>
        </div>
        {clients.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clients.slice(0, 6).map((c) => (
              <Link key={c.id} href={`/admin/clients/${c.id}`} className="group rounded-lg border border-line bg-paper p-4 transition-base hover:border-ink-600">
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
