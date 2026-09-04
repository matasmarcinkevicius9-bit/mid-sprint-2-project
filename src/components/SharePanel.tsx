import { useState } from 'react'
import { useNoteShares, useRevokeShare, useShareNote } from '../hooks/useNoteShares'

interface SharePanelProps {
  noteId: string
}

export function SharePanel({ noteId }: SharePanelProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { data: shares = [] } = useNoteShares(noteId)
  const shareNote = useShareNote()
  const revokeShare = useRevokeShare()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = email.trim()
    if (!trimmed) return
    shareNote.mutate(
      { noteId, email: trimmed },
      {
        onSuccess: () => setEmail(''),
        onError: (err) => setError(err instanceof Error ? err.message : 'Could not share note.'),
      },
    )
  }

  return (
    <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Shared with
      </h3>
      {shares.length === 0 ? (
        <p className="mb-3 text-sm text-neutral-400">Not shared with anyone yet.</p>
      ) : (
        <ul className="mb-3 space-y-1">
          {shares.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-neutral-700">{s.shared_with_email}</span>
              <button
                onClick={() => revokeShare.mutate({ id: s.id, noteId })}
                className="text-xs text-neutral-400 hover:text-red-600"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Share with email..."
          className="min-w-0 flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={shareNote.isPending}
          className="shrink-0 rounded-md bg-neutral-900 px-2.5 py-1 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          Share
        </button>
      </form>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
