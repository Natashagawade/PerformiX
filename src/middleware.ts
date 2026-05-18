import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/setup',
  '/auth/forgot-password',
  '/api/auth/login',
  '/api/auth/google',
  '/api/auth/callback',
  '/api/auth/setup',
  '/api/auth/me',
]

const ROLE_PATHS: Record<string, string[]> = {
  '/approvals': ['MANAGER', 'ADMIN'],
  '/team': ['MANAGER', 'ADMIN'],
  '/audit': ['MANAGER', 'ADMIN'],
  '/settings': ['ADMIN'],
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths + static assets
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('performix_session')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Decode JWT payload without verification (verification happens server-side)
  // This is safe for middleware since API routes do full verification
  let session: { userId: string; role: string } | null = null
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      if (payload.userId && payload.role) {
        session = { userId: payload.userId, role: payload.role }
      }
    }
  } catch {
    // Invalid token format
  }

  if (!session) {
    const res = NextResponse.redirect(new URL('/auth/login', req.url))
    res.cookies.delete('performix_session')
    return res
  }

  // Role-based route protection
  for (const [path, roles] of Object.entries(ROLE_PATHS)) {
    if (pathname.startsWith(path) && !roles.includes(session.role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Inject user info into request headers for server components
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', session.userId)
  requestHeaders.set('x-user-role', session.role)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
