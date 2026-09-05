'use client'

import { useMemo, useState } from 'react'
import { useCollections } from '@/hooks/useCollections'
import { useTags } from '@/hooks/useTags'
import { useCreateNote, useNotes } from '@/hooks/useNotes'
import { AppHeader } from '@/components/AppHeader'
import { Sidebar } from '@/components/Sidebar'
import { NoteList } from '@/components/NoteList'
import { NoteEditor } from '@/components/NoteEditor'

interface NotesWorkspaceProps {
  userId: string
  userEmail: string
}

/**
 * Auth is already guaranteed by middleware and the server component that
 * renders this, so there is no client-side auth gate here. Row-level
 * security scopes every query to the signed-in user.
 *
 * The chrome renders immediately and each region shows its own skeleton,
 * so the workspace never flashes an empty list while data is in flight.
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

  return (
    <div className="flex h-screen flex-col bg-shell">
      <AppHeader
        userEmail={userEmail}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        noteCount={filteredNotes.length}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          collections={collections}
          tags={tags}
          selectedCollectionId={selectedCollectionId}
          selectedTagId={selectedTagId}
          onSelectCollection={setSelectedCollectionId}
          onSelectTag={setSelectedTagId}
          loading={collectionsLoading || tagsLoading}
        />

        {isError ? (
          <div className="flex flex-1 items-center justify-center bg-paper px-8">
            <div className="max-w-sm text-center">
              <p className="font-serif text-[17px] text-ink">Notes could not be loaded</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                {(error as Error).message}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-5 rounded-lg bg-ink px-3.5 py-2 text-[12.5px] font-medium text-paper transition-opacity hover:opacity-85"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            <NoteList
              notes={filteredNotes}
              selectedNoteId={selectedNoteId}
              onSelectNote={setSelectedNoteId}
              onCreateNote={handleCreateNote}
              loading={notesLoading}
              searchQuery={searchQuery}
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
              <div className="flex flex-1 items-center justify-center bg-paper px-8">
                <p className="max-w-xs text-center font-serif text-[15px] leading-relaxed text-faint">
                  {notesLoading
                    ? 'Opening your notes'
                    : 'Choose a note from the list, or start a new one.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
