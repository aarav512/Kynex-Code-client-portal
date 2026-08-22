import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { RequestThread } from '@/components/requests/RequestThread';
import { ArrowLeft } from 'lucide-react';
import type { RequestMessage } from '@/lib/database.types';


export default async function AdminRequestDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from('requests')
    .select('*, clients!inner(company_name)')
    .eq('id', id)
    .maybeSingle();

  if (!request) notFound();

  const req = request as typeof request & { clients: { company_name: string } };

  const { data: messages } = await supabase
    .from('request_messages')
    .select('*')
    .eq('request_id', request.id)
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <Link href="/admin/requests" className="flex items-center gap-1 text-sm text-ink-600 transition-base hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back to requests
      </Link>
      <PageHeader
        title={req.subject}
        description={`From: ${req.clients.company_name}`}
        action={<StatusPill status={req.status} />}
      />
      <RequestThread
        requestId={req.id}
        messages={(messages as RequestMessage[]) ?? []}
        isAdmin={true}
        currentStatus={req.status}
      />
    </div>
  );
}
