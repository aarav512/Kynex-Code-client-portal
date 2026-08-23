import type { SupabaseClient } from '@supabase/supabase-js';

export async function insertMatchingColumns(
  db: SupabaseClient,
  table: string,
  payload: Record<string, unknown>
) {
  const row: Record<string, unknown> = { ...payload };
  for (let i = 0; i < 8; i++) {
    const { data, error } = await db.from(table).insert(row).select().single();
    if (!error) return { data, error: null as { message: string } | null };
    const match = error.message.match(/Could not find the '([^']+)' column/i);
    if (match) {
      delete row[match[1]];
      continue;
    }
    const required = error.message.match(/null value in column "([^"]+)"/i);
    if (required) {
      const column = required[1];
      if (column === 'contact_email' && row.email && !row.contact_email) {
        row.contact_email = row.email;
        continue;
      }
      if (column === 'email' && row.contact_email && !row.email) {
        row.email = row.contact_email;
        continue;
      }
      if (column === 'contact_phone' && row.phone && !row.contact_phone) {
        row.contact_phone = row.phone;
        continue;
      }
      if (column === 'contact_name' && !row.contact_name) {
        row.contact_name = row.name || row.company_name || 'Client';
        continue;
      }
    }
    return { data: null, error };
  }
  return { data: null, error: { message: `Could not insert into ${table}` } };
}

export async function findAuthUserByEmail(db: SupabaseClient, email: string) {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return { user: null, error };
    const user = data.users.find((entry) => (entry.email || '').toLowerCase() === target) || null;
    if (user) return { user, error: null };
    if (data.users.length < 200) return { user: null, error: null };
  }
  return { user: null, error: null };
}
