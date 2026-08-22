// Route protection. Runs before every matched request:
// 1. Refreshes the Supabase session cookie.
// 2. Redirects unauthenticated users away from protected areas.
// 3. Redirects each role away from the other role's area — this is a UX
//    convenience only. The real enforcement is Postgres RLS (see
//    supabase/schema.sql); this middleware cannot be the security boundary
//    on its own, and the app never treats it as one.
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export const runtime = 'edge';

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute && pathname !== '/reset-password') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (user && supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role;

    if (role === 'client' && pathname.startsWith('/admin')) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    if (role === 'admin' && !pathname.startsWith('/admin') && !isAuthRoute && pathname !== '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)']
};
