import { getSupabaseProjectRef } from '@/lib/supabase/env';

export const ACCESS_COOKIE = 'kynex-at';
export const REFRESH_COOKIE = 'kynex-rt';

const CHUNK = 2800;
const CHUNK_SLOTS = 8;

type CookiePair = { name: string; value: string };

function parseJwt(token: string): { sub?: string; exp?: number } | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (part.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function jwtExp(token: string) {
  return parseJwt(token)?.exp ?? 0;
}

export function jwtSub(token: string) {
  return parseJwt(token)?.sub ?? null;
}

function decodeValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function readChunked(cookies: CookiePair[], prefix: string) {
  const exact = cookies.find((cookie) => cookie.name === prefix);
  if (exact?.value) return decodeValue(exact.value);

  const parts: string[] = [];
  for (let i = 0; i < CHUNK_SLOTS; i += 1) {
    const chunk = cookies.find((cookie) => cookie.name === `${prefix}.${i}`);
    if (!chunk?.value) break;
    parts.push(decodeValue(chunk.value));
  }
  return parts.length ? parts.join('') : null;
}

export function readSession(cookies: CookiePair[]) {
  const access_token = readChunked(cookies, ACCESS_COOKIE);
  const refresh_token = readChunked(cookies, REFRESH_COOKIE);
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export function sessionCookieValue(access_token: string, refresh_token: string) {
  return JSON.stringify({
    access_token,
    refresh_token,
    token_type: 'bearer',
    expires_at: jwtExp(access_token),
    expires_in: 3600
  });
}

export function mergeCookiesForSupabase(cookies: CookiePair[]) {
  const session = readSession(cookies);
  const authName = `sb-${getSupabaseProjectRef()}-auth-token`;
  const withoutAuth = cookies.filter(
    (cookie) =>
      cookie.name !== authName &&
      !cookie.name.startsWith(`${authName}.`) &&
      cookie.name !== ACCESS_COOKIE &&
      cookie.name !== REFRESH_COOKIE &&
      !cookie.name.startsWith(`${ACCESS_COOKIE}.`) &&
      !cookie.name.startsWith(`${REFRESH_COOKIE}.`)
  );

  if (!session) return withoutAuth;

  return [
    ...withoutAuth,
    { name: authName, value: sessionCookieValue(session.access_token, session.refresh_token) }
  ];
}

function cookieString(name: string, value: string, maxAge: number, httpOnly: boolean) {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'Secure',
    'SameSite=Lax'
  ];
  if (httpOnly) parts.push('HttpOnly');
  return parts.join('; ');
}

function expireString(name: string, httpOnly: boolean) {
  return cookieString(name, '', 0, httpOnly);
}

function chunkedSet(prefix: string, value: string, maxAge: number, httpOnly: boolean) {
  const encoded = encodeURIComponent(value);
  const lines = [expireString(prefix, httpOnly)];
  for (let i = 0; i < CHUNK_SLOTS; i += 1) {
    lines.push(expireString(`${prefix}.${i}`, httpOnly));
  }

  if (encoded.length <= CHUNK) {
    lines.push(cookieString(prefix, encoded, maxAge, httpOnly));
    return lines;
  }

  let index = 0;
  for (let offset = 0; offset < encoded.length; offset += CHUNK, index += 1) {
    lines.push(cookieString(`${prefix}.${index}`, encoded.slice(offset, offset + CHUNK), maxAge, httpOnly));
  }
  return lines;
}

export function sessionCookieLines(access_token: string, refresh_token: string, httpOnly: boolean) {
  const now = Math.floor(Date.now() / 1000);
  const accessAge = Math.max(60, jwtExp(access_token) - now);
  return [
    ...chunkedSet(ACCESS_COOKIE, access_token, accessAge, httpOnly),
    ...chunkedSet(REFRESH_COOKIE, refresh_token, 60 * 60 * 24 * 30, httpOnly)
  ];
}

export function clearSessionCookieLines(httpOnly: boolean) {
  const names = [ACCESS_COOKIE, REFRESH_COOKIE];
  const lines: string[] = [];
  names.forEach((prefix) => {
    lines.push(expireString(prefix, httpOnly));
    for (let i = 0; i < CHUNK_SLOTS; i += 1) {
      lines.push(expireString(`${prefix}.${i}`, httpOnly));
    }
  });
  return lines;
}

export function appendSessionCookies(headers: Headers, access_token: string, refresh_token: string) {
  sessionCookieLines(access_token, refresh_token, true).forEach((line) => {
    headers.append('Set-Cookie', line);
  });
}

export function appendClearedSessionCookies(headers: Headers) {
  clearSessionCookieLines(true).forEach((line) => {
    headers.append('Set-Cookie', line);
  });
}

export function writeBrowserSession(access_token: string, refresh_token: string) {
  if (typeof document === 'undefined') return;
  sessionCookieLines(access_token, refresh_token, false).forEach((line) => {
    document.cookie = line;
  });
}

export function clearBrowserSession() {
  if (typeof document === 'undefined') return;
  clearSessionCookieLines(false).forEach((line) => {
    document.cookie = line;
  });
}
