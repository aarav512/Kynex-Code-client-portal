import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { InvoiceForm } from './InvoiceForm';

export default async function NewInvoicePage({ searchParams }: { searchParams: { client_id?: string } }) {
  const supabase = createClient();
  const [{ data: clients }] = await Promise.all([
    supabase.from('clients').select('id, company_name').eq('is_active', true).order('company_name'),
  ]);
  return (
    <div className="max-w-xl">
      <PageHeader eyebrow="Payments" title="Add invoice" />
      <InvoiceForm clients={clients ?? []} defaultClientId={searchParams.client_id} />
    </div>
  );
}
