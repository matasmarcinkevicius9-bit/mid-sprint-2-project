import { createBrowserClient } from '@supabase/ssr'

type BrowserClient = ReturnType<typeof createBrowserClient>

let browserClient: BrowserClient | undefined

/**
 * Supabase client for Client Components.
 *
 * Uses @supabase/ssr so the session lives in cookies rather than
 * localStorage. That is what lets middleware and Server Components verify
 * the session on the server before a protected page is rendered.
 *
 * Memoised so the whole browser session shares one client (and one auth
 * listener) rather than creating a new one per import.
 */
export function createClient(): BrowserClient {
  browserClient ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
  return browserClient
}
