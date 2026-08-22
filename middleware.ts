import { NextResponse, type NextRequest } from 'next/server';
import { copyCookies, updateSession } from '@/lib/supabase/middleware';

export const runtime = 'edge';

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    return response;
  }

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    if (pathname !== '/login') {
      url.searchParams.set('redirect', pathname);
    }
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (user && isAuthRoute && pathname !== '/reset-password') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return copyCookies(response, NextResponse.redirect(url));
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
      url.search = '';
      return copyCookies(response, NextResponse.redirect(url));
    }

    if (role === 'admin' && !pathname.startsWith('/admin') && !isAuthRoute && pathname !== '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      url.search = '';
      return copyCookies(response, NextResponse.redirect(url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)']
};
