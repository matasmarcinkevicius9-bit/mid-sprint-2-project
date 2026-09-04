import { useMemo, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useCollections } from './hooks/useCollections'
import { useTags } from './hooks/useTags'
import { useCreateNote, useNotes } from './hooks/useNotes'
import { Sidebar } from './components/Sidebar'
import { SearchBar } from './components/SearchBar'
import { NoteList } from './components/NoteList'
import { NoteEditor } from './components/NoteEditor'
import { SignIn } from './components/SignIn'

function App() {
  const { user, loading: authLoading } = useAuth()
  const [view, setView] = useState<'mine' | 'shared'>('mine')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  const { data: collections = [], isLoading: collectionsLoading } = useCollections({ enabled: !!user })
  const { data: tags = [], isLoading: tagsLoading } = useTags({ enabled: !!user })
  const { data: notes = [], isLoading: notesLoading, isError, error } = useNotes({ enabled: !!user })
  const createNote = useCreateNote()

  const myNotes = useMemo(() => notes.filter((n) => n.user_id === user?.id), [notes, user?.id])
  const sharedNotes = useMemo(() => notes.filter((n) => n.user_id !== user?.id), [notes, user?.id])

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const base = view === 'shared' ? sharedNotes : myNotes
    if (query) {
      return base.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.tags.some((t) => t.name.toLowerCase().includes(query)),
      )
    }
    if (view === 'shared') return base
    return base.filter((n) => {
      if (selectedCollectionId && n.collection_id !== selectedCollectionId) return false
      if (selectedTagId && !n.tags.some((t) => t.id === selectedTagId)) return false
      return true
    })
  }, [myNotes, sharedNotes, view, searchQuery, selectedCollectionId, selectedTagId])

  const selectedNote = filteredNotes.find((n) => n.id === selectedNoteId) ?? notes.find((n) => n.id === selectedNoteId)

  function handleCreateNote() {
    createNote.mutate(selectedCollectionId, {
      onSuccess: (created) => setSelectedNoteId(created.id),
    })
  }

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center text-neutral-400">Loading…</div>
  }

  if (!user) {
    return <SignIn />
  }

  if (collectionsLoading || tagsLoading || notesLoading) {
    return <div className="flex h-screen items-center justify-center text-neutral-400">Loading…</div>
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
        userEmail={user?.email ?? null}
        view={view}
        onSelectView={setView}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <div className="flex min-h-0 flex-1">
          <NoteList
            notes={filteredNotes}
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
            onCreateNote={view === 'mine' ? handleCreateNote : undefined}
          />
          {selectedNote ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              collections={collections}
              allTags={tags}
              currentUserId={user.id}
              currentUserEmail={user.email ?? ''}
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

export default App
