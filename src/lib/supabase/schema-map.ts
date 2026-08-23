import type { SupabaseClient } from '@supabase/supabase-js';

export const LIVE_TABLES: Record<string, string> = {
  amc_contracts: 'amc',
  payments: 'invoices'
};

export const TABLE_ALIASES: Record<string, string[]> = {
  profiles: ['profiles'],
  clients: ['clients'],
  projects: ['projects'],
  files: ['files'],
  requests: ['requests'],
  request_messages: ['request_messages'],
  payments: ['invoices', 'payments'],
  amc_contracts: ['amc', 'amc_contracts']
};

const COLUMN_RENAME: Record<string, string[]> = {
  company_name: ['name'],
  email: ['contact_email'],
  contact_email: ['email'],
  phone: ['contact_phone'],
  contact_phone: ['phone'],
  subject: ['title', 'name'],
  title: ['name', 'subject'],
  name: ['title', 'subject', 'plan_name'],
  body: ['description', 'message'],
  description: ['body', 'notes'],
  file_path: ['file_name', 'storage_path', 'path'],
  storage_path: ['file_path', 'file_name', 'path'],
  path: ['storage_path', 'file_path'],
  due_date: ['due'],
  end_date: ['ends_at'],
  plan_name: ['name', 'title']
};

export function isMissingRelationError(message: string) {
  return /Could not find the table/i.test(message) || /schema cache/i.test(message);
}

export function mappedTable(logical: string) {
  return LIVE_TABLES[logical] || logical;
}

export function copyColumnAliases(row: Record<string, unknown>, column: string) {
  const value = row[column];
  if (value == null) return;
  if (column === 'file_path') {
    row.file_name = row.file_name || value;
    row.storage_path = row.storage_path || value;
    return;
  }
  for (const alt of COLUMN_RENAME[column] || []) {
    if (row[alt] == null) row[alt] = value;
  }
}

export function expandRowAliases(row: Record<string, unknown>) {
  const path = row.storage_path || row.file_path || row.path;
  if (path != null) {
    row.storage_path = path;
    row.file_path = row.file_path ?? path;
    row.path = row.path ?? path;
    if (row.file_name == null) row.file_name = path;
  }
  if (row.email != null && row.contact_email == null) row.contact_email = row.email;
  if (row.contact_email != null && row.email == null) row.email = row.contact_email;
  if (row.phone != null && row.contact_phone == null) row.contact_phone = row.phone;
  if (row.subject != null && row.title == null) row.title = row.subject;
  if (row.title != null && row.name == null) row.name = row.title;
  if (row.name != null && row.title == null) row.title = row.name;
}

export function fillRequiredColumn(row: Record<string, unknown>, column: string) {
  if (row[column] != null) return true;
  for (const alt of COLUMN_RENAME[column] || []) {
    if (row[alt] != null) {
      row[column] = row[alt];
      return true;
    }
  }
  if (column === 'title' && row.subject != null) {
    row.title = row.subject;
    return true;
  }
  if (column === 'name' && (row.title != null || row.subject != null)) {
    row.name = row.title || row.subject;
    return true;
  }
  if (column === 'contact_email' && row.email != null) {
    row.contact_email = row.email;
    return true;
  }
  if (column === 'storage_path' || column === 'file_path' || column === 'path') {
    const path = row.storage_path || row.file_path || row.path || row.file_name;
    if (path != null) {
      row[column] = path;
      return true;
    }
  }
  return false;
}

export function wrapSupabaseTables(supabase: SupabaseClient): SupabaseClient {
  const marked = supabase as SupabaseClient & { __kynexFromWrapped?: boolean };
  if (marked.__kynexFromWrapped) return supabase;
  const originalFrom = supabase.from.bind(supabase);
  supabase.from = ((logical: string) => originalFrom(mappedTable(logical))) as SupabaseClient['from'];
  marked.__kynexFromWrapped = true;
  return supabase;
}
