import type { Session, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'kynex-session';

export type PortalRole = 'admin' | 'client';

export type StoredSession = {
  access_token: string;
  refresh_token: string;
  role?: PortalRole;
};

export function resolvePortalRole(profile: { role?: string | null; client_id?: string | null } | null): PortalRole {
  const role = String(profile?.role || '').toLowerCase().trim();
  if (role === 'admin' || role === 'administrator') return 'admin';
  return 'client';
}

function dropSavedLogins() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('kynex-auth');
}

export function saveKynexSession(session: StoredSession) {
  if (typeof window === 'undefined') return;
  dropSavedLogins();
  const existing = loadKynexSession();
  const value = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    role: session.role || existing?.role
  });
  sessionStorage.setItem(STORAGE_KEY, value);
}

export function loadKynexSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  dropSavedLogins();
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (parsed.access_token && parsed.refresh_token) return parsed;
  } catch {
    return null;
  }
  return null;
}

export function clearKynexSession() {
  if (typeof window === 'undefined') return;
  dropSavedLogins();
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem('kynex-auth');
}

export async function restoreKynexSession(supabase: SupabaseClient): Promise<Session | null> {
  const stored = loadKynexSession();
  if (stored) {
    const { data } = await supabase.auth.setSession(stored);
    if (data.session) {
      saveKynexSession(data.session);
      return data.session;
    }
  }

  const { data } = await supabase.auth.getSession();
  if (data.session) {
    saveKynexSession(data.session);
    return data.session;
  }

  return null;
}
