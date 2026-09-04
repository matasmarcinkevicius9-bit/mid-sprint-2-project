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
  const suggestions = allTags.filter(
    (t) =>
      !noteTagIds.has(t.id) &&
      t.name.toLowerCase().includes(input.trim().toLowerCase()) &&
      input.trim().length > 0,
  )

  async function commitTag(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const tag = await getOrCreateTag(trimmed)
    if (!noteTagIds.has(tag.id)) {
      addTagToNote.mutate({ noteId: note.id, tagId: tag.id })
    }
    setInput('')
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        {note.tags.map((t) => (
          <span
            key={t.id}
            className="flex items-center gap-1 rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700"
          >
            #{t.name}
            <button
              onClick={() => removeTagFromNote.mutate({ noteId: note.id, tagId: t.id })}
              className="text-neutral-400 hover:text-red-600"
              aria-label={`Remove tag ${t.name}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
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
          placeholder="Add a tag and press Enter..."
          className="w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-sm">
            {suggestions.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => commitTag(t.name)}
                  className="block w-full px-2 py-1 text-left text-sm hover:bg-neutral-100"
                >
                  #{t.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
