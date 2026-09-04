import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

/**
 * Verifies the current user against the Supabase Auth server (via
 * getUser()) rather than trusting the locally-cached session, per
 * Claude.md: signed-in-only views must not rely on the browser-side
 * session alone.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function verify() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (cancelled) return
        setUser(error ? null : data.user)
      } catch {
        // A malformed/tampered local session can make getUser() throw
        // instead of returning an error — treat that the same as "not
        // signed in" rather than leaving loading stuck forever.
        if (cancelled) return
        setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    verify()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      verify()
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
