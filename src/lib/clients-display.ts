import type { SupabaseClient } from '@supabase/supabase-js';

type ClientContact = {
  id: string;
  email?: string | null;
  contact_email?: string | null;
  contact_name?: string | null;
};

export async function hydrateClientContacts<T extends ClientContact>(
  supabase: SupabaseClient,
  clients: T[]
): Promise<T[]> {
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
    return {
      ...normalizePortalRow(client),
      email: String(client.email || client.contact_email || profile?.email || ''),
      contact_name: String(client.contact_name || profile?.full_name || '')
    };
  });
}

export async function attachClientCompany<T extends { client_id?: string | null }>(
  supabase: SupabaseClient,
  rows: T[]
): Promise<(T & { clients: { company_name: string } })[]> {
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
    ...normalizePortalRow(row),
    clients: { company_name: names.get(String(row.client_id || '')) || '' }
  }));
}

export function normalizePortalRow<T extends Record<string, unknown>>(row: T): T {
  const storedName = String(row.file_name || '');
  const path = String(row.file_path || (storedName.includes('/') ? storedName : ''));
  const display = storedName.includes('/') ? storedName.split('/').pop() : storedName;
  return {
    ...row,
    title: row.title || row.name || row.subject || row.plan_name,
    subject: row.subject || row.title || row.name,
    name: row.name || row.title,
    email: row.email || row.contact_email,
    phone: row.phone || row.contact_phone,
    plan_name: row.plan_name || row.name || row.title,
    file_path: path || row.file_path,
    file_name: display || storedName,
    company_name: row.company_name || row.name,
    is_staff: row.is_staff ?? false
  } as T;
}
