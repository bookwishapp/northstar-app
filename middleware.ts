import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Create the NextAuth middleware
const authMiddleware = NextAuth(authConfig).auth;

export default async function middleware(request: NextRequest) {
  // First, handle domain redirects (www vs non-www)
  const hostname = request.headers.get('host') || '';
  const PRIMARY_DOMAIN = process.env.PRIMARY_DOMAIN || 'www.northstarpostal.com';

  // Skip redirect for localhost and Railway default domains
  if (!hostname.includes('localhost') &&
      !hostname.includes('railway.app') &&
      !hostname.includes('127.0.0.1')) {

    // If we're not on the primary domain, redirect
    if (hostname !== PRIMARY_DOMAIN) {
      const isWww = PRIMARY_DOMAIN.startsWith('www.');
      const currentIsWww = hostname.startsWith('www.');

      // Only redirect if there's a mismatch
      if (isWww !== currentIsWww) {
        const url = request.nextUrl.clone();
        url.host = PRIMARY_DOMAIN;
        return NextResponse.redirect(url, 301);
      }
    }
  }

  // Then apply NextAuth middleware for authentication
  // @ts-expect-error - NextAuth types are complex
  return authMiddleware(request, {});
}

export const config = {
  // Run on all routes except static files and API routes that shouldn't redirect
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};