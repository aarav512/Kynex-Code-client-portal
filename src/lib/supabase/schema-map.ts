import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

export const TABLE_ALIASES: Record<string, string[]> = {
  profiles: ['profiles', 'profile', 'user_profiles'],
  clients: ['clients', 'client', 'companies', 'client_companies'],
  projects: ['projects', 'project', 'jobs'],
  files: ['files', 'file', 'documents', 'client_files', 'uploads'],
  requests: ['requests', 'request', 'support_requests', 'support_tickets', 'tickets', 'client_requests'],
  request_messages: [
    'request_messages',
    'request_message',
    'messages',
    'ticket_messages',
    'support_messages',
    'request_replies'
  ],
  payments: ['payments', 'payment', 'invoices', 'client_payments'],
  amc_contracts: ['amc_contracts', 'amc_contract', 'amc', 'amcs', 'maintenance_contracts', 'amc_agreements']
};

const COLUMN_RENAME: Record<string, string[]> = {
  company_name: ['name', 'company', 'client_name'],
  name: ['company_name', 'title', 'plan_name', 'subject', 'full_name'],
  email: ['contact_email'],
  contact_email: ['email'],
  phone: ['contact_phone'],
  contact_phone: ['phone'],
  contact_name: ['full_name', 'name'],
  plan_name: ['name', 'title', 'plan'],
  subject: ['title', 'name'],
  title: ['subject', 'name', 'plan_name', 'file_name'],
  body: ['message', 'content', 'description'],
  message: ['body', 'content'],
  created_by: ['author_id', 'user_id', 'uploaded_by'],
  author_id: ['created_by', 'user_id'],
  request_id: ['ticket_id', 'support_request_id'],
  start_date: ['starts_at', 'start'],
  end_date: ['ends_at', 'end', 'expiry_date'],
  due_date: ['due', 'due_at'],
  file_name: ['name', 'filename'],
  file_path: ['path', 'storage_path'],
  file_size: ['size'],
  mime_type: ['type', 'content_type'],
  uploaded_by: ['user_id', 'created_by'],
  invoice_number: ['invoice_no', 'number'],
  paid_date: ['paid_at'],
  is_staff: ['staff', 'from_admin']
};

type SchemaState = {
  tables: string[];
  map: Record<string, string>;
  ready: Promise<void> | null;
};

const schema: SchemaState = { tables: [], map: {}, ready: null };

export function isMissingRelationError(message: string) {
  return /Could not find the table/i.test(message) || /schema cache/i.test(message);
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function compact(value: string) {
  return value.toLowerCase().replace(/_/g, '');
}

async function listExposedTables(): Promise<string[]> {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/openapi+json'
      }
    });
    if (!res.ok) return [];
    const spec = (await res.json()) as { paths?: Record<string, unknown> };
    return unique(
      Object.keys(spec.paths || {})
        .map((path) => path.replace(/^\//, '').split(/[/{]/)[0] || '')
        .filter((name) => name && name !== 'rpc')
    );
  } catch {
    return [];
  }
}

function pickTable(logical: string, available: string[]) {
  const aliases = TABLE_ALIASES[logical] || [logical];
  for (const alias of aliases) {
    const hit = available.find((table) => table.toLowerCase() === alias.toLowerCase());
    if (hit) return hit;
  }
  const wanted = compact(logical);
  const compactHit = available.find((table) => compact(table) === wanted);
  if (compactHit) return compactHit;

  const tokens = logical.split('_').filter((token) => token.length > 2);
  const distinctive = tokens.filter((token) => !['client', 'user', 'data'].includes(token));
  const matches = available.filter((table) => {
    const lower = table.toLowerCase();
    return distinctive.some((token) => lower.includes(token));
  });
  if (matches.length === 1) return matches[0];
  return null;
}

export async function ensureTableMap(probe: (table: string) => Promise<boolean>) {
  if (schema.ready) return schema.ready;
  schema.ready = (async () => {
    try {
      let available = await listExposedTables();
      if (!available.length) {
        const guessed = unique(Object.values(TABLE_ALIASES).flat());
        available = [];
        for (const name of guessed) {
          if (await probe(name)) available.push(name);
        }
      }
      schema.tables = available;
      for (const logical of Object.keys(TABLE_ALIASES)) {
        const matched = pickTable(logical, available);
        if (matched) schema.map[logical] = matched;
      }
    } catch {
      schema.tables = [];
    }
  })();
  return schema.ready;
}

export function mappedTable(logical: string) {
  return schema.map[logical] || logical;
}

export function copyColumnAliases(row: Record<string, unknown>, column: string) {
  const value = row[column];
  if (value == null) return;
  for (const alt of COLUMN_RENAME[column] || []) {
    if (row[alt] == null) row[alt] = value;
  }
}

export function fillRequiredColumn(row: Record<string, unknown>, column: string) {
  if (row[column] != null) return true;
  for (const alt of COLUMN_RENAME[column] || []) {
    if (row[alt] != null) {
      row[column] = row[alt];
      return true;
    }
  }
  return false;
}

export function wrapSupabaseTables(supabase: SupabaseClient): SupabaseClient {
  const marked = supabase as SupabaseClient & {
    __kynexFromWrapped?: boolean;
    __kynexOriginalFrom?: SupabaseClient['from'];
  };
  if (marked.__kynexFromWrapped) return supabase;

  const originalFrom = supabase.from.bind(supabase);
  marked.__kynexOriginalFrom = originalFrom;

  const probe = async (table: string) => {
    const { error } = await originalFrom(table).select('*', { head: true, count: 'exact' });
    return !error || !isMissingRelationError(error.message);
  };

  supabase.from = ((logical: string) => {
    const calls: { op: string; args: unknown[] }[] = [];
    const builder: Record<string | symbol, unknown> = {};
    const replay = async () => {
      await ensureTableMap(probe);
      let current: unknown = originalFrom(mappedTable(logical));
      for (const call of calls) {
        const target = current as Record<string, (...next: unknown[]) => unknown>;
        current = target[call.op](...call.args);
      }
      return current;
    };
    const proxy = new Proxy(builder, {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
            replay().then((result) => {
              if (result && typeof (result as Promise<unknown>).then === 'function') {
                return (result as Promise<unknown>).then(resolve, reject);
              }
              return resolve(result);
            }, reject);
        }
        return (...args: unknown[]) => {
          calls.push({ op: String(prop), args });
          return proxy;
        };
      }
    });
    return proxy;
  }) as SupabaseClient['from'];

  marked.__kynexFromWrapped = true;
  return supabase;
}
