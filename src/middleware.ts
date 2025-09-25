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
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for API routes entirely
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Check if the pathname already has a locale prefix
  const hasLocalePrefix = /^\/(tr|en)(\/|$)/.test(pathname);
  console.log('hasLocalePrefix:', hasLocalePrefix, pathname, pathname.startsWith('/api'));
  
  // If no locale prefix and not an internal Next.js route, redirect to default locale
  if (!hasLocalePrefix && !pathname.startsWith('/_next')) {
    const locale = 'tr'; // default locale
    const redirectUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
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
    // Match all paths except API routes, Next.js internals and static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}