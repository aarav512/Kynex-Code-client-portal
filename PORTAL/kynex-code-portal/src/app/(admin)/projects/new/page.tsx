import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProjectForm } from '../[id]/ProjectForm';

export default async function NewProjectPage({ searchParams }: { searchParams: { client_id?: string } }) {
  const supabase = createClient();
  const { data: clients } = await supabase.from('clients').select('id, company_name').eq('is_active', true).order('company_name');
  return (
    <div className="max-w-xl">
      <PageHeader eyebrow="Projects" title="New project" />
      <ProjectForm clients={clients ?? []} defaultClientId={searchParams.client_id} />
    </div>
  );
}
