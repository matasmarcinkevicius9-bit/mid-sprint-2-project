import { useEffect, useRef, useState } from 'react'
import type { Collection, Note, Tag } from '../types'
import { useDeleteNote, useUpdateNote } from '../hooks/useNotes'
import { TagPicker } from './TagPicker'
import { SharePanel } from './SharePanel'
import { CommentsPanel } from './CommentsPanel'

interface NoteEditorProps {
  note: Note
  collections: Collection[]
  allTags: Tag[]
  currentUserId: string
  currentUserEmail: string
  onDeleted: () => void
}

const AUTOSAVE_DELAY_MS = 500

export function NoteEditor({
  note,
  collections,
  allTags,
  currentUserId,
  currentUserEmail,
  onDeleted,
}: NoteEditorProps) {
  const isOwner = note.user_id === currentUserId
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [sharing, setSharing] = useState(false)
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // App.tsx mounts this component with key={note.id}, so a fresh instance
  // (and fresh title/content state) is created whenever the selected note
  // changes — no reset effect needed here.

  useEffect(() => {
    if (!isOwner) return
    if (title === note.title && content === note.content) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      updateNote.mutate({ id: note.id, patch: { title, content } })
    }, AUTOSAVE_DELAY_MS)
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [isOwner, title, content, note.id, note.title, note.content, updateNote])

  function handleDelete() {
    if (!confirm('Delete this note? This cannot be undone.')) return
    deleteNote.mutate(note.id)
    onDeleted()
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto p-6">
      {!isOwner && (
        <div className="mb-4 rounded-md bg-neutral-100 px-3 py-1.5 text-xs text-neutral-500">
          Shared with you — view and comment only.
        </div>
      )}

      {isOwner && (
        <div className="mb-4 flex items-center justify-between gap-4">
          <select
            value={note.collection_id ?? ''}
            onChange={(e) =>
              updateNote.mutate({
                id: note.id,
                patch: { collection_id: e.target.value || null },
              })
            }
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
          >
            <option value="">No collection</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSharing((v) => !v)}
              className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              {sharing ? 'Hide sharing' : 'Share'}
            </button>
            <button
              onClick={handleDelete}
              className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              Delete note
            </button>
          </div>
        </div>
      )}

      {isOwner && sharing && <SharePanel noteId={note.id} />}

      {isOwner ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="mb-3 border-none text-2xl font-semibold text-neutral-900 outline-none placeholder:text-neutral-300"
        />
      ) : (
        <h1 className="mb-3 text-2xl font-semibold text-neutral-900">{note.title || 'Untitled'}</h1>
      )}

      {isOwner && (
        <div className="mb-4">
          <TagPicker note={note} allTags={allTags} />
        </div>
      )}

      {isOwner ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="min-h-[300px] flex-1 resize-none border-none text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-300"
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
          {note.content || 'No content'}
        </p>
      )}

      <CommentsPanel
        noteId={note.id}
        currentUserId={currentUserId}
        currentUserEmail={currentUserEmail}
      />
    </div>
  )
}
