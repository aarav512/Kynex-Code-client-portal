import { NextResponse } from 'next/server';
import { appendClearedSessionCookies } from '@/lib/supabase/session';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  appendClearedSessionCookies(response.headers);
  return response;
}
