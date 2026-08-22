function clean(value: string | undefined) {
  return (value || '').trim().replace(/^['"]+|['"]+$/g, '');
}

export function getSupabaseUrl() {
  let url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1$/i, '');
  url = url.replace(/\/auth\/v1$/i, '');
  return url;
}

export function getSupabaseAnonKey() {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseServiceRoleKey() {
  return clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isSupabaseConfigured() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && key && !url.includes('placeholder') && !key.includes('placeholder'));
}

export function getSupabaseProjectRef() {
  const match = getSupabaseUrl().match(/^https:\/\/([a-z0-9-]+)\.supabase\.co$/i);
  return match?.[1] ?? 'kynex';
}
