import type { SupabaseClient } from '@supabase/supabase-js';
import {
  copyColumnAliases,
  expandRowAliases,
  fillRequiredColumn,
  isMissingRelationError,
  mappedTable,
  nextDefaultForColumn,
  TABLE_ALIASES
} from '@/lib/supabase/schema-map';

export async function insertMatchingColumns(
  db: SupabaseClient,
  table: string,
  payload: Record<string, unknown>
) {
  const names = TABLE_ALIASES[table] || [table];
  let lastError: { message: string } | null = null;

  for (const candidate of [mappedTable(table), ...names]) {
    const row: Record<string, unknown> = { ...payload };
    expandRowAliases(row);
    for (let i = 0; i < 24; i++) {
      const { data, error } = await db.from(candidate).insert(row).select().single();
      if (!error) return { data, error: null as { message: string } | null };
      lastError = error;
      if (isMissingRelationError(error.message)) break;

      const missing = error.message.match(/Could not find the '([^']+)' column/i);
      if (missing) {
        copyColumnAliases(row, missing[1]);
        if (missing[1] !== 'storage_path') delete row[missing[1]];
        continue;
      }
      const required = error.message.match(/null value in column "([^"]+)"/i);
      if (required) {
        expandRowAliases(row);
        if (fillRequiredColumn(row, required[1])) continue;
      }
      const enumValue = error.message.match(/invalid input value for enum \w+: "([^"]+)"/i);
      const checkCol = error.message.match(/check constraint "\w*?([a-z_]+?)_check"/i);
      const badCol =
        checkCol?.[1] ||
        (enumValue && Object.keys(row).find((key) => String(row[key]) === enumValue[1]));
      if (badCol && row[badCol] != null) {
        const next = nextDefaultForColumn(badCol, row[badCol]);
        if (next != null) {
          row[badCol] = next;
          continue;
        }
      }
      if (/invalid input syntax for type integer/i.test(error.message) && typeof row.priority === 'string') {
        row.priority = 0;
        continue;
      }
      return { data: null, error };
    }
  }

  return { data: null, error: lastError || { message: `Could not insert into ${table}` } };
}

export async function updateMatchingColumns(
  db: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
  id: string
) {
  const row: Record<string, unknown> = { ...payload };
  for (let i = 0; i < 16; i++) {
    const { error } = await db.from(table).update(row).eq('id', id);
    if (!error) return { error: null as { message: string } | null };
    const missing = error.message.match(/Could not find the '([^']+)' column/i);
    if (missing) {
      copyColumnAliases(row, missing[1]);
      delete row[missing[1]];
      continue;
    }
    return { error };
  }
  return { error: { message: `Could not update ${table}` } };
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
