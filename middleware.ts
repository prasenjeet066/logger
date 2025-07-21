import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth/')

  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-auth-status', token ? 'authenticated' : 'unauthenticated')

  // Handle auth pages (prevent authenticated users from accessing login/register)
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // Protected routes logic
  const isProtectedRoute = [
    '/dashboard',
    '/profile',
    '/settings',
    // Add more protected routes here
  ].some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedRoute && !token) {
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Continue with modified request
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/auth/:path*',
    // Add more paths that need middleware protection
  ]
}
