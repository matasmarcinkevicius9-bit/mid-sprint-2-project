'use client'

import { useActionState, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signIn, signUp, type AuthFormState } from './actions'

const EMPTY: AuthFormState = {}

export function SignInForm() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [oauthError, setOauthError] = useState<string | null>(null)
  const action = mode === 'sign-in' ? signIn : signUp
  const [state, formAction, pending] = useActionState(action, EMPTY)

  async function handleGoogleSignIn() {
    setOauthError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setOauthError(error.message)
  }

  const field =
    'w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-[13.5px] text-ink transition-colors placeholder:text-faint focus:border-accent focus:outline-none'

  return (
    <div className="w-full max-w-[360px]">
      <div className="mb-8">
        <h1 className="font-serif text-[26px] font-medium tracking-tight text-ink">Notes</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          {mode === 'sign-in'
            ? 'Sign in to reach your workspace.'
            : 'Create an account to start writing.'}
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:border-faint hover:bg-shell"
      >
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.6 0-14.1 4.3-17.7 10.7z" />
          <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.6 34.9 27 36 24 36c-5.3 0-9.6-3.4-11.3-8l-6.6 5.1C9.8 39.6 16.3 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41.4 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
        </svg>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="eyebrow">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form action={formAction} className="space-y-2.5">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Email"
          aria-label="Email"
          className={field}
        />
        <input
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          placeholder="Password"
          aria-label="Password"
          className={field}
        />

        {(state.error || oauthError) && (
          <p className="pt-1 text-[12.5px] leading-relaxed text-danger" role="alert">
            {state.error ?? oauthError}
          </p>
        )}
        {state.message && (
          <p className="pt-1 text-[12.5px] leading-relaxed text-accent" role="status">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="!mt-4 w-full rounded-lg bg-ink px-3 py-2.5 text-[13.5px] font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {pending ? 'Working' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
        className="mt-6 w-full text-center text-[12.5px] text-muted transition-colors hover:text-ink"
      >
        {mode === 'sign-in'
          ? 'No account? Create one'
          : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
