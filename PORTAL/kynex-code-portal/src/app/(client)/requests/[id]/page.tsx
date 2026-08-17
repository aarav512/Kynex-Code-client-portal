import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill, REQUEST_STATUS_TONE } from '@/components/ui/StatusPill';
import { RequestThread } from '@/components/requests/RequestThread';
import { REQUEST_STATUS_LABEL, REQUEST_CATEGORY_LABEL, formatDate } from '@/lib/utils';

export default async function ClientRequestDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();

  const { data: request } = await supabase
    .from('requests')
    .select('*')
    .eq('id', params.id)
    .eq('client_id', profile!.client_id!)
    .single();

  if (!request) notFound();

  const { data: messages } = await supabase
    .from('request_messages')
    .select('id, author_name, author_role, body, created_at')
    .eq('request_id', request.id)
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Requests" title={request.title} />
      <div className="mb-6 flex flex-wrap gap-4">
        <StatusPill label={REQUEST_STATUS_LABEL[request.status]} tone={REQUEST_STATUS_TONE[request.status]} />
        <span className="font-mono text-xs text-ink-600">{REQUEST_CATEGORY_LABEL[request.category]}</span>
        <span className="font-mono text-xs text-ink-600 capitalize">{request.priority} priority</span>
        <span className="font-mono text-xs text-ink-600">Submitted {formatDate(request.created_at)}</span>
      </div>
      <div className="kx-panel p-4 mb-6">
        <p className="kx-eyebrow mb-2">Description</p>
        <p className="whitespace-pre-wrap text-sm text-ink-950">{request.description}</p>
      </div>
      <p className="kx-eyebrow mb-3">Conversation</p>
      <RequestThread requestId={request.id} messages={messages ?? []} />
    </div>
  );
}
