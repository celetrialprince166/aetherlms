// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000']

// const isProtectedRoutes = createRouteMatcher(['/dashboard(.*)', '/payment(.*)'])
// export default clerkMiddleware(async (auth, req) => {
//   if (isProtectedRoutes(req)) {
//     auth().protect()
//   }
// })

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// }

import { authMiddleware, redirectToSignIn } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/home',
  '/courses',
  '/courses/(.*)',
  '/preview/(.*)',
  '/api/(.*)',
  '/auth/sign-in/(.*)',
  '/auth/sign-up/(.*)',
  '/auth/callback/(.*)',
  '/typography',
  '/design-system/(.*)',
  '/payment',
  '/verify-route',
  '/db-error'
]

// Define dynamic routes that shouldn't be statically generated
const dynamicRoutes = [
  '/courses',
  '/dashboard',
  '/home',
  '/api/courses',
  '/api/toggle-resilient-auth',
  '/api/auth',
  '/api/database-check'
]

// Function to check if a path is a public route
function isPathPublic(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.includes('(.*)')) {
      const baseRoute = route.replace('(.*)', '')
      return pathname.startsWith(baseRoute)
    }
    return route === pathname
  }) || 
  pathname.startsWith('/api/auth/') || 
  pathname.startsWith('/db-error')
}

// Auth middleware configuration
export default authMiddleware({
  publicRoutes,
  
  beforeAuth: async (req) => {
    // Skip middleware checks for static assets and media files
    const path = req.nextUrl.pathname
    if (
      path.includes('/_next') ||
      path.includes('/favicon') ||
      path.includes('/api/auth') ||
      path.endsWith('.svg') || 
      path.endsWith('.jpg') || 
      path.endsWith('.png') || 
      path.endsWith('.ico')
    ) {
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  
  afterAuth(auth, req) {
    if (!auth.userId && !isPathPublic(req.nextUrl.pathname)) {
      return redirectToSignIn({ returnBackUrl: req.url })
    }
    return NextResponse.next()
  }
})

// Set cache headers for dynamic routes
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add a custom header to prevent static generation for dynamic routes
  const path = request.nextUrl.pathname
  if (dynamicRoutes.some(route => path.startsWith(route))) {
    response.headers.set('cache-control', 'no-store, must-revalidate')
    response.headers.set('x-middleware-cache', 'no-cache')
  }

  return response
}

// Configure the middleware to run for all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}