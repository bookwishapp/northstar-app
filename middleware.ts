import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the hostname from the request
  const hostname = request.headers.get('host') || '';

  // Define your primary domain (change this to your actual domain)
  // For example: 'northstarpostal.com' or 'www.northstarpostal.com'
  const PRIMARY_DOMAIN = process.env.PRIMARY_DOMAIN || 'www.northstarpostal.com';

  // Skip redirect for localhost and Railway default domains
  if (hostname.includes('localhost') ||
      hostname.includes('railway.app') ||
      hostname.includes('127.0.0.1')) {
    return NextResponse.next();
  }

  // If we're already on the primary domain, continue
  if (hostname === PRIMARY_DOMAIN) {
    return NextResponse.next();
  }

  // Determine if we should redirect from non-www to www or vice versa
  const isWww = PRIMARY_DOMAIN.startsWith('www.');
  const currentIsWww = hostname.startsWith('www.');

  // Only redirect if there's a mismatch
  if (isWww !== currentIsWww) {
    const url = request.nextUrl.clone();
    url.host = PRIMARY_DOMAIN;

    // Use 301 permanent redirect for SEO
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  // Run on all routes except static files and API routes that shouldn't redirect
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};