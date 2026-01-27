import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSiteByDomain } from '@/lib/sites-config';

/**
 * Middleware to detect the current site based on domain
 * and inject site context into headers for API routes
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Detect which site we're on based on the domain
  const site = getSiteByDomain(hostname);
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  
  // Add the site ID to headers so API routes can access it
  requestHeaders.set('x-site-id', site.id);
  requestHeaders.set('x-site-name', site.name);
  
  // Also add to URL for debugging if needed (optional)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Add site info to response headers for client-side access if needed
  response.headers.set('x-site-id', site.id);
  
  return response;
}

// Configure which routes should be processed by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
