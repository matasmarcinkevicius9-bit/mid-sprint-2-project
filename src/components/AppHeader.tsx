'use client'

import { useQueryClient } from '@tanstack/react-query'
import { signOut } from '../app/actions/auth'

interface AppHeaderProps {
  userEmail: string
  searchQuery: string
  onSearchChange: (value: string) => void
  noteCount: number
}

export function AppHeader({
  userEmail,
  searchQuery,
  onSearchChange,
  noteCount,
}: AppHeaderProps) {
  const queryClient = useQueryClient()

  async function handleSignOut() {
    queryClient.clear()
    await signOut()
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-6 border-b border-line bg-paper px-5">
      {/* The wordmark takes the serif face the notes themselves are set in. */}
      <span className="font-serif text-[17px] font-medium tracking-tight text-ink">
        Notes
      </span>

      <div className="relative min-w-0 flex-1 max-w-md">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search all notes"
          aria-label="Search all notes by title, body or tag"
          className="w-full rounded-lg border border-line bg-shell py-1.5 pl-9 pr-3 text-[13px] text-ink transition-colors placeholder:text-faint hover:border-line focus:border-accent focus:bg-paper focus:outline-none"
        />
      </div>

      {searchQuery.trim() && (
        <span className="eyebrow hidden shrink-0 sm:inline">
          {noteCount} {noteCount === 1 ? 'match' : 'matches'}
        </span>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <span className="hidden max-w-[190px] truncate text-[12px] text-muted md:inline" title={userEmail}>
          {userEmail}
        </span>
        <button
          onClick={handleSignOut}
          className="rounded-md px-2.5 py-1.5 text-[12px] font-medium text-muted transition-colors hover:bg-shell hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
