import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, NextFetchEvent } from 'next/server'
import type { NextRequest } from 'next/server'
import { withAuth, NextRequestWithAuth } from 'next-auth/middleware'

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ['tr', 'en'],
  defaultLocale: 'tr',
  localePrefix: 'always'
});

const authMiddleware = withAuth(
  async function middleware(request: NextRequestWithAuth) {
    // Handle internationalization first
    const response = intlMiddleware(request);

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Remove locale prefix for route checking
        const pathWithoutLocale = pathname.replace(/^\/(en|tr)/, '') || '/';
        
        // Allow access to public routes
        if (
          pathWithoutLocale.startsWith('/api/auth') ||
          pathWithoutLocale === '/' ||
          pathWithoutLocale === '/login' ||
          pathWithoutLocale === '/signup' ||
          pathWithoutLocale === '/forgot-password' ||
          pathWithoutLocale.startsWith('/reset-password') ||
          pathWithoutLocale.startsWith('/admin')
        ) {
          return true
        }
        
        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  // Handle admin routes separately (no auth required)
  if (request.nextUrl.pathname.startsWith('/admin') || 
      request.nextUrl.pathname.startsWith('/en/admin') ||
      request.nextUrl.pathname.startsWith('/tr/admin')) {
    return intlMiddleware(request);
  }
  
  // Use auth middleware for other routes
  return authMiddleware(request as NextRequestWithAuth, event);
}

export const config = {
  matcher: [
    '/',
    '/(tr|en)/:path*',
    '/api/:path*',
    '/dashboard/:path*',
    '/timesheet/:path*',
    '/projects/:path*',
    '/tasks/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/admin/:path*'
  ]
}