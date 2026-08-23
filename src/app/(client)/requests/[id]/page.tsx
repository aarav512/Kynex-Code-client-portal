'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { RequestThread } from '@/components/requests/RequestThread';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { ArrowLeft } from 'lucide-react';
import type { RequestMessage } from '@/lib/database.types';

export default function ClientRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { loading, error, data } = usePortalData(async (supabase) => {
    const { data: request } = await supabase.from('requests').select('*').eq('id', id).maybeSingle();
    if (!request) return { request: null, messages: [] as RequestMessage[] };
    const { normalizePortalRow } = await import('@/lib/clients-display');
    const { data: messages } = await supabase.from('request_messages').select('*').eq('request_id', request.id).order('created_at', { ascending: true });
    return { request: normalizePortalRow(request as Record<string, unknown>), messages: (messages as RequestMessage[]) ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data?.request ? (
        <div className="space-y-6">
          <Link href="/requests" className="flex items-center gap-1 text-sm text-ink-600"><ArrowLeft className="h-4 w-4" /> Back</Link>
          <PageHeader title={String(data.request.subject || 'Request')} action={<StatusPill status={String(data.request.status)} />} />
          <RequestThread requestId={String(data.request.id)} clientId={data.request.client_id ? String(data.request.client_id) : ''} messages={data.messages} isAdmin={false} currentStatus={String(data.request.status)} />
        </div>
      ) : data ? <p className="text-sm text-ink-600">Request not found.</p> : null}
    </PortalState>
  );
}
