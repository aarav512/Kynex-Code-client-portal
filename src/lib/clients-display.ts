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
      ...client,
      email: String(client.email || client.contact_email || profile?.email || ''),
      contact_name: String(client.contact_name || profile?.full_name || '')
    };
  });
}
