import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotesWorkspace } from './NotesWorkspace'

/**
 * Protected workspace.
 *
 * The session is verified on the server before this page renders.
 * getUser() revalidates the token against the Supabase Auth server, so a
 * forged or stale cookie cannot get past it. Middleware performs the same
 * check earlier in the request; this is the second line of defence, so
 * the page can never render for an unauthenticated visitor even if
 * middleware were bypassed or misconfigured.
 */
export default async function NotesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/signin')
  }

  return <NotesWorkspace userId={user.id} userEmail={user.email ?? ''} />
}
