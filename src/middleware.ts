import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For now, we'll skip actual authentication check as it requires Supabase session
  // In production, you would check for a valid Supabase session cookie
  
  // Get the pathname
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ['/client', '/freelancer'];
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // In production, check for authentication token/session here
    // For now, we'll allow access since we have placeholder credentials
    // const token = request.cookies.get('sb-access-token');
    // if (!token) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
