'use client'

import type { Note } from '../types'
import { NoteListSkeleton } from './Skeleton'

interface NoteListProps {
  notes: Note[]
  selectedNoteId: string | null
  onSelectNote: (id: string) => void
  onCreateNote?: () => void
  loading?: boolean
  searchQuery?: string
}

function relativeDate(iso: string) {
  const then = new Date(iso)
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000)
  if (days === 0) return then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return then.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  loading = false,
  searchQuery = '',
}: NoteListProps) {
  return (
    <div className="flex h-full w-[304px] shrink-0 flex-col border-r border-line bg-shell">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-5">
        <span className="eyebrow">
          {loading ? 'Loading' : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
        </span>
        {onCreateNote && (
          <button
            onClick={onCreateNote}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1.5 text-[12px] font-medium text-paper transition-opacity hover:opacity-85"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New note
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <NoteListSkeleton />
        ) : notes.length === 0 ? (
          <p className="px-5 py-6 text-[13px] leading-relaxed text-muted">
            {searchQuery.trim()
              ? `No notes match “${searchQuery.trim()}”.`
              : 'No notes yet. Create one to get started.'}
          </p>
        ) : (
          <ul>
            {notes.map((note) => {
              const selected = selectedNoteId === note.id
              return (
                <li key={note.id} className="relative">
                  {/* The ink rail is the one place colour marks state. */}
                  {selected && (
                    <span className="absolute inset-y-0 left-0 w-[2px] bg-accent" aria-hidden="true" />
                  )}
                  <button
                    onClick={() => onSelectNote(note.id)}
                    aria-current={selected ? 'true' : undefined}
                    className={`block w-full border-b border-line-soft px-5 py-3.5 text-left transition-colors duration-150 ${
                      selected ? 'bg-paper' : 'hover:bg-line-soft/60'
                    }`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span
                        className={`min-w-0 flex-1 truncate font-serif text-[15px] ${
                          selected ? 'text-ink' : 'text-ink/90'
                        }`}
                      >
                        {note.title || 'Untitled'}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-faint">
                        {relativeDate(note.updated_at)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[12.5px] leading-relaxed text-muted">
                      {note.content || 'Empty note'}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.map((t) => (
                          <span
                            key={t.id}
                            className="rounded-full border border-line bg-paper px-1.5 py-[1px] text-[10.5px] text-muted"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
