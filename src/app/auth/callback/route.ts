import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Only same-origin relative paths are accepted as a post-login
 * destination. Anything else falls back to the workspace.
 *
 * Without this, `?next=@evil.com` would make `${origin}${next}` parse as
 * `https://app@evil.com` — userinfo `app`, host `evil.com` — sending a
 * freshly authenticated user off-site.
 */
function safeNext(raw: string | null): string {
  if (!raw) return '/notes'
  // Must start with exactly one slash: rejects "@evil.com", "//evil.com"
  // and absolute URLs.
  return /^\/(?!\/)/.test(raw) ? raw : '/notes'
}

/**
 * OAuth return leg. Supabase redirects here with a code, which is
 * exchanged for a session and written to cookies on the server.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error.message)}`, origin),
    )
  }

  return NextResponse.redirect(new URL('/signin?error=Missing%20auth%20code', origin))
}
