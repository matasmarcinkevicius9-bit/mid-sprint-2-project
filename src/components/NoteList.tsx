import type { Note } from '../types'

interface NoteListProps {
  notes: Note[]
  selectedNoteId: string | null
  onSelectNote: (id: string) => void
  onCreateNote?: () => void
}

export function NoteList({ notes, selectedNoteId, onSelectNote, onCreateNote }: NoteListProps) {
  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-neutral-200">
      <div className="flex items-center justify-between border-b border-neutral-200 p-3">
        <span className="text-sm text-neutral-500">{notes.length} note{notes.length === 1 ? '' : 's'}</span>
        {onCreateNote && (
          <button
            onClick={onCreateNote}
            className="rounded-md bg-neutral-900 px-2.5 py-1 text-sm text-white hover:bg-neutral-700"
          >
            + New note
          </button>
        )}
      </div>
      <ul className="flex-1 overflow-y-auto">
        {notes.length === 0 && (
          <li className="p-4 text-sm text-neutral-400">No notes here yet.</li>
        )}
        {notes.map((note) => (
          <li key={note.id}>
            <button
              onClick={() => onSelectNote(note.id)}
              className={`block w-full border-b border-neutral-100 px-4 py-3 text-left ${
                selectedNoteId === note.id ? 'bg-neutral-100' : 'hover:bg-neutral-50'
              }`}
            >
              <div className="truncate text-sm font-medium text-neutral-900">
                {note.title || 'Untitled'}
              </div>
              <div className="mt-0.5 truncate text-xs text-neutral-500">
                {note.content || 'No content'}
              </div>
              {note.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {note.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-600"
                    >
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
