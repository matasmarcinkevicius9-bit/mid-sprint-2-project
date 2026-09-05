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
  const [saved, setSaved] = useState(false)
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Holds edits typed but not yet written, so they can be flushed if this
  // editor unmounts before the debounce fires.
  const pending = useRef<{ title: string; content: string } | null>(null)
  const deleted = useRef(false)
  // Kept in refs so the unmount-only effect always sees current values.
  // Written in an effect, never during render.
  const saveNow = useRef<(patch: { title: string; content: string }) => void>(() => {})
  useEffect(() => {
    saveNow.current = (patch) => updateNote.mutate({ id: note.id, patch })
  })

  // The workspace mounts this with key={note.id}, so switching notes gives a
  // fresh instance and fresh state — no reset effect needed.
  useEffect(() => {
    if (title === note.title && content === note.content) {
      pending.current = null
      return
    }
    pending.current = { title, content }
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      const patch = pending.current
      if (!patch) return
      updateNote.mutate(
        { id: note.id, patch },
        {
          onSuccess: () => {
            pending.current = null
            setSaved(true)
            setTimeout(() => setSaved(false), 1600)
          },
        },
      )
    }, AUTOSAVE_DELAY_MS)
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [title, content, note.id, note.title, note.content, updateNote])

  // Switching notes unmounts this component and cancels the pending
  // debounce. Without this flush, anything typed in the last half-second
  // before switching would be silently lost.
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      if (pending.current && !deleted.current) {
        saveNow.current(pending.current)
        pending.current = null
      }
    }
  }, [])

  function handleDelete() {
    if (!confirm('Delete this note? This cannot be undone.')) return
    // Stop the unmount flush from resurrecting a note we just deleted.
    deleted.current = true
    pending.current = null
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    deleteNote.mutate(note.id)
    onDeleted()
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-paper">
      {/* Toolbar: everything here is machine fact, so it stays quiet. */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-6">
        <select
          value={note.collection_id ?? ''}
          onChange={(e) =>
            updateNote.mutate({ id: note.id, patch: { collection_id: e.target.value || null } })
          }
          aria-label="Collection"
          className="rounded-md border border-transparent bg-transparent py-1 pl-1.5 pr-6 text-[12.5px] text-muted transition-colors hover:border-line hover:bg-shell focus:border-accent focus:outline-none"
        >
          <option value="">No collection</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <span
          className={`eyebrow transition-opacity duration-300 ${saved ? 'opacity-100' : 'opacity-0'}`}
          aria-live="polite"
        >
          Saved
        </span>

        <button
          onClick={handleDelete}
          className="ml-auto rounded-md px-2.5 py-1.5 text-[12px] font-medium text-muted transition-colors hover:bg-shell hover:text-danger"
        >
          Delete note
        </button>
      </div>

      {/* The writing surface: a measured column, set in the serif. */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[68ch] px-8 py-10">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            aria-label="Note title"
            className="w-full border-none bg-transparent font-serif text-[30px] font-medium leading-tight tracking-[-0.01em] text-ink outline-none placeholder:text-line"
          />

          <div className="mt-5 mb-7">
            <TagPicker note={note} allTags={allTags} />
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing…"
            aria-label="Note body"
            className="min-h-[55vh] w-full resize-none border-none bg-transparent font-serif text-[16.5px] leading-[1.75] text-ink/90 outline-none placeholder:text-line"
          />
        </div>
      </div>
    </div>
  )
}
