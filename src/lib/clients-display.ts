import type { SupabaseClient } from '@supabase/supabase-js';

export async function hydrateClientContacts(supabase: SupabaseClient, clients: any[]): Promise<any[]> {
  const ids = clients.map((client) => String(client.id)).filter(Boolean);
  if (!ids.length) return clients;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('client_id, email, full_name')
    .in('client_id', ids);

  const byClient = new Map(
    (profiles ?? []).map((profile) => [String(profile.client_id), profile])
  );

  return clients.map((client) => {
    const profile = byClient.get(String(client.id));
    const normalized = normalizePortalRow(client);
    return {
      ...client,
      ...normalized,
      email: String(client.email || client.contact_email || profile?.email || ''),
      contact_name: String(client.contact_name || profile?.full_name || '')
    };
  });
}

export async function attachClientCompany(supabase: SupabaseClient, rows: any[]): Promise<any[]> {
  const ids = [...new Set(rows.map((row) => String(row.client_id || '')).filter(Boolean))];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data } = await supabase.from('clients').select('*').in('id', ids);
    for (const client of data ?? []) {
      const row = client as { id: string; company_name?: string; name?: string; contact_name?: string };
      names.set(String(row.id), String(row.company_name || row.name || row.contact_name || 'Client'));
    }
  }
  return rows.map((row) => ({
    ...row,
    ...normalizePortalRow(row),
    clients: { company_name: names.get(String(row.client_id || '')) || '' }
  }));
}

export function normalizePortalRow(row: object): any {
  const record = row as Record<string, unknown>;
  const storedName = String(record.file_name || '');
  const path = String(record.storage_path || record.file_path || record.path || (storedName.includes('/') ? storedName : ''));
  const display = storedName.includes('/') ? storedName.split('/').pop() : storedName || path.split('/').pop();
  return {
    ...record,
    title: record.title || record.name || record.subject || record.plan_name,
    subject: record.subject || record.title || record.name,
    name: record.name || record.title,
    email: record.email || record.contact_email,
    phone: record.phone || record.contact_phone,
    plan_name: record.plan_name || record.name || record.title,
    file_path: path || record.file_path,
    file_name: display || storedName,
    company_name: record.company_name || record.name,
    is_staff: record.is_staff ?? false
  };
}
