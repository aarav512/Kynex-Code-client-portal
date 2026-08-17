import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { RequestForm } from './RequestForm';

export default async function NewRequestPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('client_id', profile!.client_id!)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-xl">
      <PageHeader eyebrow="Requests" title="New request" />
      <RequestForm projects={projects ?? []} />
    </div>
  );
}
