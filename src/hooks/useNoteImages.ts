'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toError } from '@/lib/supabase/error'
import type { NoteImage, NoteImageWithUrl } from '../types'

const supabase = createClient()

const BUCKET = 'note-images'
const SIGNED_URL_TTL_SECONDS = 60 * 60

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

const imagesKey = (noteId: string | null) => ['note_images', noteId]

/**
 * Rejects a file before it reaches the network, so the user gets an
 * immediate reason rather than a storage error. Mirrors the limits set on
 * the bucket in 004_note_images.sql.
 */
export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name} is not a supported image (PNG, JPEG, WebP or GIF).`
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name} is larger than 5 MB.`
  }
  return null
}

function extensionFor(file: File) {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : ''
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  return file.type.replace('image/', '') || 'bin'
}

/**
 * Lists a note's images and pairs each with a signed URL. The bucket is
 * private, so images cannot be rendered from a plain public URL.
 */
export function useNoteImages(noteId: string | null) {
  return useQuery({
    queryKey: imagesKey(noteId),
    queryFn: async (): Promise<NoteImageWithUrl[]> => {
      const { data, error } = await supabase
        .from('note_images')
        .select('*')
        .eq('note_id', noteId as string)
        .order('created_at', { ascending: true })
      if (error) throw toError(error)

      const rows = (data ?? []) as NoteImage[]
      if (rows.length === 0) return []

      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(
          rows.map((r) => r.storage_path),
          SIGNED_URL_TTL_SECONDS,
        )
      if (signError) throw toError(signError)

      const urlByPath = new Map<string, string | null>()
      signed?.forEach((entry: { path: string | null; signedUrl: string | null }) => {
        if (entry.path) urlByPath.set(entry.path, entry.signedUrl ?? null)
      })

      return rows.map((row) => ({ ...row, url: urlByPath.get(row.storage_path) ?? null }))
    },
    enabled: !!noteId,
    // Signed URLs expire, so refresh well inside their lifetime.
    staleTime: (SIGNED_URL_TTL_SECONDS / 2) * 1000,
  })
}

export function useUploadNoteImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      noteId,
      userId,
      file,
    }: {
      noteId: string
      userId: string
      file: File
    }): Promise<NoteImage> => {
      const invalid = validateImage(file)
      if (invalid) throw new Error(invalid)

      // The first path segment must be the user id: the storage policies
      // key off it to scope access.
      const path = `${userId}/${noteId}/${crypto.randomUUID()}.${extensionFor(file)}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) throw toError(uploadError)

      const { data, error } = await supabase
        .from('note_images')
        .insert({ note_id: noteId, storage_path: path, file_name: file.name })
        .select()
        .single()

      if (error) {
        // Do not leave an orphaned object behind if the row insert fails.
        await supabase.storage.from(BUCKET).remove([path])
        throw toError(error)
      }
      return data as NoteImage
    },
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: imagesKey(variables.noteId) }),
  })
}

export function useDeleteNoteImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ image }: { image: NoteImage; noteId: string }) => {
      // Remove the stored object before its row. The other way round, a
      // failure here would strand the file in the bucket with nothing left
      // pointing at it; this order leaves the row intact on failure, so the
      // delete can simply be retried.
      const { error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove([image.storage_path])
      if (removeError) throw toError(removeError)

      const { error } = await supabase.from('note_images').delete().eq('id', image.id)
      if (error) throw toError(error)
    },
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: imagesKey(variables.noteId) }),
  })
}
