'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import Link from 'next/link';
import { NewRequestButton } from './NewRequestButton';

export default function ClientRequestsPage() {
  const { loading, error, data } = usePortalData(async (supabase, session) => {
    const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', session.user.id).maybeSingle();
    if (!profile?.client_id) return { linked: false, rows: [] as { id: string; subject: string; status: string; updated_at: string }[] };
    const { data: rows } = await supabase.from('requests').select('*').eq('client_id', profile.client_id).order('updated_at', { ascending: false });
    return { linked: true, rows: rows ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data && !data.linked ? <EmptyState title="No client account linked" /> : data ? (
        <div className="space-y-6">
          <PageHeader title="Requests" description="Support and change requests." action={<NewRequestButton />} />
          {data.rows.length ? data.rows.map((r) => (
            <Link key={r.id} href={`/requests/${r.id}`} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
              <span>{r.subject}</span>
              <span className="flex items-center gap-2 text-xs text-ink-600">{formatDate(r.updated_at)} <StatusPill status={r.status} /></span>
            </Link>
          )) : <EmptyState title="No requests yet" action={<NewRequestButton />} />}
        </div>
      ) : null}
    </PortalState>
  );
}
