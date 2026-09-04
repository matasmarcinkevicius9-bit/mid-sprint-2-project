'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Collection, Tag } from '../types'
import {
  useCreateCollection,
  useDeleteCollection,
  useRenameCollection,
} from '../hooks/useCollections'
import { useDeleteTag } from '../hooks/useTags'
import { signOut } from '../app/actions/auth'

interface SidebarProps {
  collections: Collection[]
  tags: Tag[]
  selectedCollectionId: string | null
  selectedTagId: string | null
  onSelectCollection: (id: string | null) => void
  onSelectTag: (id: string | null) => void
  userEmail: string | null
}

export function Sidebar({
  collections,
  tags,
  selectedCollectionId,
  selectedTagId,
  onSelectCollection,
  onSelectTag,
  userEmail,
}: SidebarProps) {
  const queryClient = useQueryClient()
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

  function startRename(collection: Collection) {
    setEditingId(collection.id)
    setEditingName(collection.name)
  }

  function commitRename() {
    const name = editingName.trim()
    if (editingId && name) {
      renameCollection.mutate({ id: editingId, name })
    }
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

  async function handleSignOut() {
    queryClient.clear()
    await signOut()
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50">
      <div className="border-b border-neutral-200 p-4">
        <h1 className="text-lg font-semibold text-neutral-900">Notes</h1>
        {userEmail && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-neutral-500" title={userEmail}>
              {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="shrink-0 text-xs text-neutral-500 underline hover:text-neutral-800"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <button
          onClick={() => {
            onSelectCollection(null)
            onSelectTag(null)
          }}
          className={`mb-3 w-full rounded-md px-3 py-1.5 text-left text-sm font-medium ${
            selectedCollectionId === null
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          All Notes
        </button>

        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Collections
          </span>
        </div>
        <ul className="mb-4 space-y-0.5">
          {collections.map((c) => (
            <li key={c.id} className="group flex items-center gap-1">
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
                  className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                />
              ) : (
                <button
                  onClick={() => onSelectCollection(c.id)}
                  onDoubleClick={() => startRename(c)}
                  className={`flex-1 truncate rounded-md px-2 py-1 text-left text-sm ${
                    selectedCollectionId === c.id
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-200'
                  }`}
                  title="Click to select, double-click to rename"
                >
                  {c.name}
                </button>
              )}
              <button
                onClick={() => handleDeleteCollection(c.id)}
                className="hidden shrink-0 rounded px-1.5 text-xs text-neutral-400 hover:bg-red-100 hover:text-red-600 group-hover:block"
                aria-label={`Delete ${c.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddCollection} className="mb-6 flex gap-1">
          <input
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="New collection"
            className="min-w-0 flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-2 py-1 text-sm text-white hover:bg-neutral-700"
          >
            Add
          </button>
        </form>

        <div className="mb-2 px-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Tags
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 px-1">
          {tags.length === 0 && (
            <span className="text-xs text-neutral-400">No tags yet</span>
          )}
          {tags.map((t) => (
            <span
              key={t.id}
              className={`group flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                selectedTagId === t.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              <button onClick={() => onSelectTag(selectedTagId === t.id ? null : t.id)}>
                #{t.name}
              </button>
              <button
                onClick={() => handleDeleteTag(t.id)}
                className="hidden text-neutral-400 hover:text-red-600 group-hover:inline"
                aria-label={`Delete tag ${t.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
    </aside>
  )
}
