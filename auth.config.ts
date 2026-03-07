import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isLoginPage = nextUrl.pathname === '/admin/login';

      // Allow access to login page always
      if (isLoginPage) {
        if (isLoggedIn) {
          // Redirect logged in users away from login
          return Response.redirect(new URL('/admin', nextUrl));
        }
        return true; // Allow access to login page when not logged in
      }

      // Protect other admin routes
      if (isOnAdmin) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;