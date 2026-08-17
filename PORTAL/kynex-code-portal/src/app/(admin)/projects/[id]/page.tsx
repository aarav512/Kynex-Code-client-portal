import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProjectForm } from './ProjectForm';

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: project } = await supabase.from('projects').select('*').eq('id', params.id).single();
  if (!project) notFound();
  const { data: clients } = await supabase.from('clients').select('id, company_name').eq('is_active', true).order('company_name');
  return (
    <div className="max-w-xl">
      <PageHeader eyebrow="Projects" title="Edit project" />
      <ProjectForm clients={clients ?? []} project={project} />
    </div>
  );
}
