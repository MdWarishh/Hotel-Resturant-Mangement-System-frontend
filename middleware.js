import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies or check if we're on a protected route
  const token = request.cookies.get('token')?.value;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register/super-admin'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Dashboard routes that require authentication
  const isDashboardRoute = pathname.startsWith('/dashboard');
  
  // If accessing dashboard without being on login page, we need to handle client-side
  // Since we store token in localStorage (client-side), we can't access it in middleware
  // So we'll let the page components handle auth checks via AuthContext
  
  // Redirect root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
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