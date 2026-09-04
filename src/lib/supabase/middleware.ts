import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Routes that require a signed-in user. */
const PROTECTED_PREFIXES = ['/notes']

/** Routes that a signed-in user should not sit on. */
const AUTH_ROUTES = ['/signin']

/**
 * Refreshes the Supabase session cookie and enforces route protection on
 * the server, before any protected page is rendered.
 *
 * getUser() is used rather than getSession() because it revalidates the
 * token against the Supabase Auth server instead of trusting whatever
 * the browser sent.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirectedFrom', pathname)
    return redirectKeepingCookies(url, supabaseResponse)
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/notes'
    url.search = ''
    return redirectKeepingCookies(url, supabaseResponse)
  }

  return supabaseResponse
}

/**
 * Redirects while preserving any auth cookies Supabase refreshed during
 * getUser(). A bare NextResponse.redirect() would discard them, dropping
 * a rotated refresh token and signing the user out unexpectedly.
 */
function redirectKeepingCookies(url: URL, from: NextResponse) {
  const response = NextResponse.redirect(url)
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
  return response
}
