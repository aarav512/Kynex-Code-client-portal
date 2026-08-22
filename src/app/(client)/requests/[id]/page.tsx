import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { RequestThread } from '@/components/requests/RequestThread';
import { ArrowLeft } from 'lucide-react';
import type { RequestMessage } from '@/lib/database.types';


export const runtime = 'edge';

export default async function ClientRequestDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('id', user!.id)
    .maybeSingle();

  if (!profile?.client_id) notFound();

  const { data: request } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .eq('client_id', profile.client_id)
    .maybeSingle();

  if (!request) notFound();

  const { data: messages } = await supabase
    .from('request_messages')
    .select('*')
    .eq('request_id', request.id)
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <Link href="/requests" className="flex items-center gap-1 text-sm text-ink-600 transition-base hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back to requests
      </Link>
      <PageHeader title={request.subject} action={<StatusPill status={request.status} />} />
      <RequestThread
        requestId={request.id}
        messages={(messages as RequestMessage[]) ?? []}
        isAdmin={false}
        currentStatus={request.status}
      />
    </div>
  );
}
