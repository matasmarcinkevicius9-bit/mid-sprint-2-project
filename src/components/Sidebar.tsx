'use client'

import { useState } from 'react'
import type { Collection, Tag } from '../types'
import {
  useCreateCollection,
  useDeleteCollection,
  useRenameCollection,
} from '../hooks/useCollections'
import { useDeleteTag } from '../hooks/useTags'
import { SidebarSkeleton } from './Skeleton'

interface SidebarProps {
  collections: Collection[]
  tags: Tag[]
  selectedCollectionId: string | null
  selectedTagId: string | null
  onSelectCollection: (id: string | null) => void
  onSelectTag: (id: string | null) => void
  loading?: boolean
}

export function Sidebar({
  collections,
  tags,
  selectedCollectionId,
  selectedTagId,
  onSelectCollection,
  onSelectTag,
  loading = false,
}: SidebarProps) {
  const [newCollectionName, setNewCollectionName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const createCollection = useCreateCollection()
  const renameCollection = useRenameCollection()
  const deleteCollection = useDeleteCollection()
  const deleteTag = useDeleteTag()

  function handleAddCollection(e: React.FormEvent) {
    e.preventDefault()
    const name = newCollectionName.trim()
    if (!name) return
    createCollection.mutate(name)
    setNewCollectionName('')
  }

  function commitRename() {
    const name = editingName.trim()
    if (editingId && name) renameCollection.mutate({ id: editingId, name })
    setEditingId(null)
  }

  function handleDeleteCollection(id: string) {
    if (selectedCollectionId === id) onSelectCollection(null)
    deleteCollection.mutate(id)
  }

  function handleDeleteTag(id: string) {
    if (selectedTagId === id) onSelectTag(null)
    deleteTag.mutate(id)
  }

  const rowBase =
    'w-full rounded-lg px-3 py-[7px] text-left text-[13px] transition-colors duration-150'

  return (
    <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-line bg-shell">
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <button
          onClick={() => {
            onSelectCollection(null)
            onSelectTag(null)
          }}
          className={`${rowBase} mb-7 font-medium ${
            selectedCollectionId === null && selectedTagId === null
              ? 'bg-accent-wash text-accent'
              : 'text-ink hover:bg-line-soft'
          }`}
        >
          All notes
        </button>

        <div className="mb-2.5 px-3">
          <span className="eyebrow">Collections</span>
        </div>

        {loading ? (
          <SidebarSkeleton />
        ) : (
          <>
            <ul className="mb-2 space-y-0.5">
              {collections.length === 0 && (
                <li className="px-3 py-1 text-[12.5px] text-faint">None yet</li>
              )}
              {collections.map((c) => (
                <li key={c.id} className="group relative">
                  {editingId === c.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="w-full rounded-lg border border-accent bg-paper px-3 py-[6px] text-[13px] outline-none"
                    />
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectCollection(c.id)}
                        onDoubleClick={() => {
                          setEditingId(c.id)
                          setEditingName(c.name)
                        }}
                        title="Double-click to rename"
                        className={`${rowBase} truncate pr-8 ${
                          selectedCollectionId === c.id
                            ? 'bg-accent-wash text-accent'
                            : 'text-ink hover:bg-line-soft'
                        }`}
                      >
                        {c.name}
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(c.id)}
                        aria-label={`Delete collection ${c.name}`}
                        className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded p-1 text-faint transition-colors hover:bg-paper hover:text-danger group-hover:block"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddCollection} className="relative mb-8">
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                aria-hidden="true"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Add collection"
                aria-label="Add a collection"
                className="w-full rounded-lg border border-dashed border-line bg-transparent py-[7px] pl-8 pr-3 text-[13px] text-ink transition-colors placeholder:text-faint hover:border-faint focus:border-solid focus:border-accent focus:bg-paper focus:outline-none"
              />
            </form>

            <div className="mb-2.5 px-3">
              <span className="eyebrow">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5 px-3">
              {tags.length === 0 && <span className="text-[12.5px] text-faint">None yet</span>}
              {tags.map((t) => {
                const active = selectedTagId === t.id
                return (
                  <span
                    key={t.id}
                    className={`group inline-flex items-center rounded-full border text-[11.5px] transition-colors ${
                      active
                        ? 'border-accent bg-accent-wash text-accent'
                        : 'border-line bg-paper text-muted hover:border-faint hover:text-ink'
                    }`}
                  >
                    <button
                      onClick={() => onSelectTag(active ? null : t.id)}
                      className="py-[3px] pl-2.5 pr-1"
                    >
                      {t.name}
                    </button>
                    <button
                      onClick={() => handleDeleteTag(t.id)}
                      aria-label={`Delete tag ${t.name}`}
                      className="py-[3px] pr-2 pl-0.5 text-faint opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )
              })}
            </div>
          </>
        )}
      </nav>
    </aside>
  )
}
