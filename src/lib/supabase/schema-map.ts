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
  mime_type: ['file_type', 'content_type', 'type'],
  file_type: ['mime_type', 'content_type', 'type'],
  due_date: ['due'],
  end_date: ['ends_at', 'renewal_date'],
  renewal_date: ['end_date', 'ends_at'],
  paid_date: ['paid_at', 'payment_date'],
  plan_name: ['name', 'title'],
  project_type: ['type', 'category'],
  request_type: ['type', 'category']
};

const REQUIRED_DEFAULTS: Record<string, unknown[]> = {
  project_type: ['general', 'website', 'web', 'application', 'app', 'other', 'custom', 'development', 'maintenance'],
  request_type: ['support', 'general', 'change', 'other'],
  type: ['general', 'website', 'support', 'other'],
  category: ['general', 'support', 'other', 'change'],
  priority: ['normal', 'medium', 'low', 'high', 0]
};

const STATUS_DEFAULTS: Record<string, unknown[]> = {
  requests: ['open', 'new', 'in_progress', 'submitted', 'active', 'resolved', 'closed'],
  projects: ['in_progress', 'active', 'planning', 'review', 'completed', 'on_hold', 'draft'],
  amc: ['active', 'expired', 'cancelled'],
  amc_contracts: ['active', 'expired', 'cancelled'],
  invoices: ['pending', 'unpaid', 'paid', 'overdue', 'cancelled', 'draft'],
  payments: ['pending', 'unpaid', 'paid', 'overdue', 'cancelled', 'draft']
};

const NO_NAME_TABLES = new Set([
  'requests',
  'request_messages',
  'amc',
  'amc_contracts',
  'invoices',
  'payments',
  'files'
]);

export function omitsNameColumn(table?: string) {
  if (!table) return false;
  return NO_NAME_TABLES.has(table) || NO_NAME_TABLES.has(mappedTable(table));
}

export function statusDefaultsFor(table?: string, enumName?: string) {
  if (enumName?.includes('request') || table === 'requests') return STATUS_DEFAULTS.requests;
  if (enumName?.includes('project') || table === 'projects') return STATUS_DEFAULTS.projects;
  if (enumName?.includes('amc') || table === 'amc' || table === 'amc_contracts') return STATUS_DEFAULTS.amc;
  if (enumName?.includes('invoice') || enumName?.includes('payment') || table === 'invoices' || table === 'payments') {
    return STATUS_DEFAULTS.invoices;
  }
  return STATUS_DEFAULTS.requests;
}

export function makeInvoiceNumber() {
  return `INV-${Date.now()}`;
}

export function isMissingRelationError(message: string) {
  if (/column/i.test(message)) return false;
  return /Could not find the table/i.test(message);
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

export function expandRowAliases(row: Record<string, unknown>, table?: string) {
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
  const useName = !omitsNameColumn(table);
  if (useName) {
    if (row.title != null && row.name == null) row.name = row.title;
    if (row.name != null && row.title == null) row.title = row.name;
    if (row.plan_name != null) {
      row.name = row.name ?? row.plan_name;
      row.title = row.title ?? row.plan_name;
    }
  } else {
    delete row.name;
  }
  const end = row.end_date || row.ends_at || row.renewal_date;
  if (end != null) {
    row.end_date = row.end_date ?? end;
    row.renewal_date = row.renewal_date ?? end;
    row.ends_at = row.ends_at ?? end;
  }
  const kind = row.file_type || row.mime_type || row.content_type;
  if (kind != null) {
    row.file_type = kind;
    row.mime_type = row.mime_type ?? kind;
  }
}

export function fillRequiredColumn(row: Record<string, unknown>, column: string, table?: string) {
  if (row[column] != null && row[column] !== '') return true;
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
  if (column === 'name') {
    if (omitsNameColumn(table)) return false;
    if (row.title != null || row.subject != null || row.plan_name != null) {
      row.name = row.title || row.subject || row.plan_name;
      return true;
    }
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
  if (column === 'file_type' || column === 'mime_type') {
    row[column] = row.file_type || row.mime_type || row.content_type || 'application/octet-stream';
    return true;
  }
  if (column === 'file_size') {
    row.file_size = row.file_size ?? 0;
    return true;
  }
  if (column === 'status') {
    row.status = row.status || statusDefaultsFor(table)[0];
    return true;
  }
  if (column === 'invoice_number' || column === 'number') {
    row[column] = row.invoice_number || row.number || makeInvoiceNumber();
    return true;
  }
  if (column === 'renewal_date' || column === 'end_date' || column === 'ends_at' || column === 'due_date' || column === 'start_date' || column === 'paid_date') {
    const date =
      row.renewal_date ||
      row.end_date ||
      row.ends_at ||
      row.due_date ||
      row.start_date ||
      row.paid_date ||
      new Date().toISOString().slice(0, 10);
    row[column] = date;
    return true;
  }
  const defaults = REQUIRED_DEFAULTS[column];
  if (defaults?.length) {
    row[column] = defaults[0];
    return true;
  }
  if (column.endsWith('_type') || column === 'type' || column === 'category') {
    row[column] = 'general';
    return true;
  }
  if (column === 'priority') {
    row.priority = 'normal';
    return true;
  }
  if (!/_id$/.test(column) && column !== 'id' && !column.includes('date')) {
    const fallback = row.name || row.title || row.subject || row.plan_name || row.description || 'general';
    if (fallback != null) {
      row[column] = fallback;
      return true;
    }
  }
  return false;
}

export function nextDefaultForColumn(column: string, current: unknown, table?: string, enumName?: string) {
  const defaults =
    column === 'status'
      ? statusDefaultsFor(table, enumName)
      : REQUIRED_DEFAULTS[column] ||
        (column.endsWith('_type') || column === 'type' ? REQUIRED_DEFAULTS.project_type : []);
  const idx = defaults.findIndex((value) => String(value) === String(current));
  if (idx === -1) return defaults[0] ?? null;
  if (idx < defaults.length - 1) return defaults[idx + 1];
  return null;
}

export function wrapSupabaseTables(supabase: SupabaseClient): SupabaseClient {
  const marked = supabase as SupabaseClient & { __kynexFromWrapped?: boolean };
  if (marked.__kynexFromWrapped) return supabase;
  const originalFrom = supabase.from.bind(supabase);
  supabase.from = ((logical: string) => originalFrom(mappedTable(logical))) as SupabaseClient['from'];
  marked.__kynexFromWrapped = true;
  return supabase;
}
