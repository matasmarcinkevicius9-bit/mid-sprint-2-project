'use client'

import { useEffect, useRef, useState } from 'react'
import type { Collection, Note, Tag } from '../types'
import { useDeleteNote, useUpdateNote } from '../hooks/useNotes'
import { TagPicker } from './TagPicker'

interface NoteEditorProps {
  note: Note
  collections: Collection[]
  allTags: Tag[]
  onDeleted: () => void
}

const AUTOSAVE_DELAY_MS = 500

export function NoteEditor({ note, collections, allTags, onDeleted }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The workspace mounts this component with key={note.id}, so a fresh
  // instance (and fresh title/content state) is created whenever the
  // selected note changes — no reset effect needed here.

  useEffect(() => {
    if (title === note.title && content === note.content) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      updateNote.mutate({ id: note.id, patch: { title, content } })
    }, AUTOSAVE_DELAY_MS)
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [title, content, note.id, note.title, note.content, updateNote])

  function handleDelete() {
    if (!confirm('Delete this note? This cannot be undone.')) return
    deleteNote.mutate(note.id)
    onDeleted()
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto p-6">
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
        <button
          onClick={handleDelete}
          className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          Delete note
        </button>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        className="mb-3 border-none text-2xl font-semibold text-neutral-900 outline-none placeholder:text-neutral-300"
      />

      <div className="mb-4">
        <TagPicker note={note} allTags={allTags} />
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing..."
        className="min-h-[300px] flex-1 resize-none border-none text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-300"
      />
    </div>
  )
}
