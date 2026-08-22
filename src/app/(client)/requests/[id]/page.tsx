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
    const { data: messages } = await supabase.from('request_messages').select('*').eq('request_id', request.id).order('created_at', { ascending: true });
    return { request, messages: (messages as RequestMessage[]) ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data?.request ? (
        <div className="space-y-6">
          <Link href="/requests" className="flex items-center gap-1 text-sm text-ink-600"><ArrowLeft className="h-4 w-4" /> Back</Link>
          <PageHeader title={data.request.subject} action={<StatusPill status={data.request.status} />} />
          <RequestThread requestId={data.request.id} messages={data.messages} isAdmin={false} currentStatus={data.request.status} />
        </div>
      ) : data ? <p className="text-sm text-ink-600">Request not found.</p> : null}
    </PortalState>
  );
}
