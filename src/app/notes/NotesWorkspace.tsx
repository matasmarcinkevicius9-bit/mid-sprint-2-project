'use client'

import { useMemo, useState } from 'react'
import { useCollections } from '@/hooks/useCollections'
import { useTags } from '@/hooks/useTags'
import { useCreateNote, useNotes } from '@/hooks/useNotes'
import { Sidebar } from '@/components/Sidebar'
import { SearchBar } from '@/components/SearchBar'
import { NoteList } from '@/components/NoteList'
import { NoteEditor } from '@/components/NoteEditor'

interface NotesWorkspaceProps {
  userId: string
  userEmail: string
}

/**
 * The signed-in workspace. Auth is already guaranteed by middleware and
 * the server component that renders this, so there is no client-side
 * auth gate here. Row-level security scopes every query to userId.
 */
export function NotesWorkspace({ userEmail }: NotesWorkspaceProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  const { data: collections = [], isLoading: collectionsLoading } = useCollections()
  const { data: tags = [], isLoading: tagsLoading } = useTags()
  const { data: notes = [], isLoading: notesLoading, isError, error } = useNotes()
  const createNote = useCreateNote()

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      return notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.tags.some((t) => t.name.toLowerCase().includes(query)),
      )
    }
    return notes.filter((n) => {
      if (selectedCollectionId && n.collection_id !== selectedCollectionId) return false
      if (selectedTagId && !n.tags.some((t) => t.id === selectedTagId)) return false
      return true
    })
  }, [notes, searchQuery, selectedCollectionId, selectedTagId])

  const selectedNote =
    filteredNotes.find((n) => n.id === selectedNoteId) ??
    notes.find((n) => n.id === selectedNoteId)

  function handleCreateNote() {
    createNote.mutate(selectedCollectionId, {
      onSuccess: (created) => setSelectedNoteId(created.id),
    })
  }

  if (collectionsLoading || tagsLoading || notesLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-neutral-400">Loading…</div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        Failed to load notes: {(error as Error).message}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white text-neutral-900">
      <Sidebar
        collections={collections}
        tags={tags}
        selectedCollectionId={selectedCollectionId}
        selectedTagId={selectedTagId}
        onSelectCollection={setSelectedCollectionId}
        onSelectTag={setSelectedTagId}
        userEmail={userEmail}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <div className="flex min-h-0 flex-1">
          <NoteList
            notes={filteredNotes}
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
            onCreateNote={handleCreateNote}
          />
          {selectedNote ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              collections={collections}
              allTags={tags}
              onDeleted={() => setSelectedNoteId(null)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
              Select a note or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
