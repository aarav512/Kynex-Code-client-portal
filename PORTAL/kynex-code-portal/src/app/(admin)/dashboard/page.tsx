import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataRow, DataCell } from '@/components/ui/DataTable';
import { StatusPill, REQUEST_STATUS_TONE, PAYMENT_STATUS_TONE } from '@/components/ui/StatusPill';
import { REQUEST_STATUS_LABEL, PAYMENT_STATUS_LABEL, formatDate, formatMoney } from '@/lib/utils';

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [
    { count: clientCount },
    { count: projectCount },
    { data: invoices },
    { data: requests },
    { count: amcCount },
  ] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('projects').select('id', { count: 'exact', head: true }).not('status', 'eq', 'completed'),
    supabase.from('invoices').select('status, amount').neq('status', 'paid'),
    supabase.from('requests').select('id, title, status, created_at, clients(company_name)').neq('status', 'completed').order('created_at', { ascending: false }).limit(8),
    supabase.from('amc').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  const pendingPayments = (invoices ?? []).filter(i => i.status === 'pending').length;
  const overduePayments = (invoices ?? []).filter(i => i.status === 'overdue').length;
  const openRequests = (requests ?? []).length;

  const stats = [
    { label: 'Active clients', value: clientCount ?? 0, href: '/admin/clients' },
    { label: 'Active projects', value: projectCount ?? 0, href: '/admin/projects' },
    { label: 'Pending payments', value: pendingPayments, href: '/admin/payments' },
    { label: 'Overdue payments', value: overduePayments, href: '/admin/payments' },
    { label: 'Open requests', value: openRequests, href: '/admin/requests' },
    { label: 'Active AMC', value: amcCount ?? 0, href: '/admin/amc' },
  ];

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Overview" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-10">
        {stats.map(({ label, value, href }) => (
          <Link key={label} href={href} className="kx-panel p-5 hover:border-ink-700 transition-colors">
            <p className="kx-eyebrow mb-2">{label}</p>
            <p className="font-display text-2xl font-medium text-ink-950">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <p className="kx-eyebrow mb-3">Open requests</p>
          {requests && requests.length > 0 ? (
            <DataTable columns={['Title', 'Client', 'Status', 'Date']}>
              {requests.map((r: any) => (
                <DataRow key={r.id}>
                  <DataCell>
                    <Link href={`/admin/requests/${r.id}`} className="font-medium hover:underline">{r.title}</Link>
                  </DataCell>
                  <DataCell className="text-sm text-ink-600">{r.clients?.company_name}</DataCell>
                  <DataCell><StatusPill label={REQUEST_STATUS_LABEL[r.status]} tone={REQUEST_STATUS_TONE[r.status]} /></DataCell>
                  <DataCell className="font-mono text-xs text-ink-600">{formatDate(r.created_at)}</DataCell>
                </DataRow>
              ))}
            </DataTable>
          ) : <div className="kx-panel px-4 py-8 text-center text-sm text-ink-600">No open requests.</div>}
        </section>

        <section>
          <p className="kx-eyebrow mb-3">Unpaid invoices</p>
          {invoices && invoices.length > 0 ? (
            <DataTable columns={['Amount', 'Status']}>
              {invoices.slice(0, 8).map((inv: any) => (
                <DataRow key={inv.id || inv.amount}>
                  <DataCell className="font-medium">{formatMoney(inv.amount)}</DataCell>
                  <DataCell><StatusPill label={PAYMENT_STATUS_LABEL[inv.status]} tone={PAYMENT_STATUS_TONE[inv.status]} /></DataCell>
                </DataRow>
              ))}
            </DataTable>
          ) : <div className="kx-panel px-4 py-8 text-center text-sm text-ink-600">All invoices paid.</div>}
        </section>
      </div>
    </div>
  );
}
