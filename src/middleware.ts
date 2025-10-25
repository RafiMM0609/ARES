import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // NOTE: Authentication is currently disabled for development/demo purposes
  // In production with a real Supabase instance, uncomment the authentication logic below
  // and update the cookie name to match your Supabase project
  
  // Get the pathname
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ['/client', '/freelancer'];
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // TODO: Enable in production with real Supabase credentials
    // The actual cookie name depends on your Supabase project
    // Common formats: 'sb-<project-ref>-auth-token' or use Supabase's createServerClient()
    // 
    // Example implementation:
    // const authToken = request.cookies.get('sb-<your-project-ref>-auth-token');
    // if (!authToken) {
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
