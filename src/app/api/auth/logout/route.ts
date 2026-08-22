import { NextRequest, NextResponse } from 'next/server';
import { applyCookies, createEdgeClient, type PendingCookie } from '@/lib/supabase/edge';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const jar: PendingCookie[] = [];
  const supabase = createEdgeClient(request, jar);
  await supabase.auth.signOut();

  const response = NextResponse.json({ ok: true });
  applyCookies(response, jar);
  return response;
}
