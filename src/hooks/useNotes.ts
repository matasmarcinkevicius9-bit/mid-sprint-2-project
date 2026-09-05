'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toError } from '@/lib/supabase/error'
import type { Note, Tag } from '../types'

const supabase = createClient()

const NOTES_KEY = ['notes']

interface NoteImageRow {
  id: string
  storage_path: string
  created_at: string
}

interface NoteRow {
  id: string
  user_id: string
  collection_id: string | null
  title: string
  content: string
  created_at: string
  updated_at: string
  note_tags: { tags: Tag }[]
  note_images?: NoteImageRow[] | null
}

const IMAGE_BUCKET = 'note-images'
const PREVIEW_TTL_SECONDS = 60 * 60

/** The note's earliest image, which is the one shown in the list. */
function firstImage(row: NoteRow): NoteImageRow | null {
  const images = row.note_images ?? []
  if (images.length === 0) return null
  return [...images].sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
}

function toNote(row: NoteRow, previewUrl: string | null = null): Note {
  return {
    id: row.id,
    user_id: row.user_id,
    collection_id: row.collection_id,
    title: row.title,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags: row.note_tags.map((nt) => nt.tags),
    preview_image_url: previewUrl,
  }
}

/**
 * Signs every note's first image in one request rather than one per note.
 * The bucket is private, so a thumbnail needs a signed URL to render.
 */
async function withPreviewUrls(rows: NoteRow[]): Promise<Note[]> {
  const paths = rows
    .map((row) => firstImage(row)?.storage_path)
    .filter((p): p is string => !!p)

  if (paths.length === 0) return rows.map((row) => toNote(row))

  const urlByPath = new Map<string, string>()
  const { data: signed } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(paths, PREVIEW_TTL_SECONDS)

  signed?.forEach((entry: { path: string | null; signedUrl: string | null }) => {
    if (entry.path && entry.signedUrl) urlByPath.set(entry.path, entry.signedUrl)
  })

  return rows.map((row) => {
    const path = firstImage(row)?.storage_path
    return toNote(row, (path && urlByPath.get(path)) || null)
  })
}

export function useNotes(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: NOTES_KEY,
    queryFn: async (): Promise<Note[]> => {
      const { data, error } = await supabase
        .from('notes')
        .select('*, note_tags(tags(*)), note_images(id, storage_path, created_at)')
        .order('updated_at', { ascending: false })
      if (error) throw toError(error)
      return withPreviewUrls(data as unknown as NoteRow[])
    },
    enabled: options?.enabled ?? true,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (collectionId: string | null): Promise<Note> => {
      const { data, error } = await supabase
        .from('notes')
        .insert({ collection_id: collectionId, title: '', content: '' })
        .select('*, note_tags(tags(*)), note_images(id, storage_path, created_at)')
        .single()
      if (error) throw toError(error)
      return toNote(data as unknown as NoteRow)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<Pick<Note, 'title' | 'content' | 'collection_id'>>
    }) => {
      const { error } = await supabase.from('notes').update(patch).eq('id', id)
      if (error) throw toError(error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // Deleting the note cascades its note_images rows, but storage
      // objects are not covered by that cascade, so remove the files
      // first or they are orphaned in the bucket forever.
      const { data: images } = await supabase
        .from('note_images')
        .select('storage_path')
        .eq('note_id', id)

      const paths = (images ?? []).map((i: { storage_path: string }) => i.storage_path)
      if (paths.length > 0) {
        await supabase.storage.from(IMAGE_BUCKET).remove(paths)
      }

      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) throw toError(error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  })
}

export function useAddTagToNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ noteId, tagId }: { noteId: string; tagId: string }) => {
      const { error } = await supabase.from('note_tags').insert({ note_id: noteId, tag_id: tagId })
      if (error) throw toError(error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  })
}

export function useRemoveTagFromNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ noteId, tagId }: { noteId: string; tagId: string }) => {
      const { error } = await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', noteId)
        .eq('tag_id', tagId)
      if (error) throw toError(error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  })
}
