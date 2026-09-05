'use client'

import { useState } from 'react'
import type { Note, Tag } from '../types'
import { getOrCreateTag } from '../hooks/useTags'
import { useAddTagToNote, useRemoveTagFromNote } from '../hooks/useNotes'

interface TagPickerProps {
  note: Note
  allTags: Tag[]
}

export function TagPicker({ note, allTags }: TagPickerProps) {
  const [input, setInput] = useState('')
  const addTagToNote = useAddTagToNote()
  const removeTagFromNote = useRemoveTagFromNote()

  const noteTagIds = new Set(note.tags.map((t) => t.id))
  const query = input.trim().toLowerCase()
  const suggestions = query
    ? allTags.filter((t) => !noteTagIds.has(t.id) && t.name.toLowerCase().includes(query))
    : []

  async function commitTag(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const tag = await getOrCreateTag(trimmed)
    if (!noteTagIds.has(tag.id)) addTagToNote.mutate({ noteId: note.id, tagId: tag.id })
    setInput('')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {note.tags.map((t) => (
        <span
          key={t.id}
          className="group inline-flex items-center rounded-full border border-line bg-shell text-[11.5px] text-muted transition-colors hover:border-faint"
        >
          <span className="py-[3px] pl-2.5 pr-1">{t.name}</span>
          <button
            onClick={() => removeTagFromNote.mutate({ noteId: note.id, tagId: t.id })}
            aria-label={`Remove tag ${t.name}`}
            className="py-[3px] pr-2 pl-0.5 text-faint opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}

      <div className="relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitTag(input)
            }
          }}
          placeholder={note.tags.length ? 'Add tag' : 'Add a tag'}
          aria-label="Add a tag"
          className="w-[104px] rounded-full border border-dashed border-line bg-transparent px-2.5 py-[3px] text-[11.5px] text-ink transition-colors placeholder:text-faint hover:border-faint focus:border-solid focus:border-accent focus:outline-none"
        />
        {suggestions.length > 0 && (
          <ul className="absolute left-0 top-full z-10 mt-1.5 max-h-44 w-40 overflow-y-auto rounded-lg border border-line bg-paper py-1 shadow-sm">
            {suggestions.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => commitTag(t.name)}
                  className="block w-full px-3 py-1.5 text-left text-[12.5px] text-ink transition-colors hover:bg-shell"
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
