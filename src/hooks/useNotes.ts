import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Note, Tag } from '../types'

const NOTES_KEY = ['notes']

interface NoteRow {
  id: string
  user_id: string
  collection_id: string | null
  title: string
  content: string
  created_at: string
  updated_at: string
  note_tags: { tags: Tag }[]
}

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    user_id: row.user_id,
    collection_id: row.collection_id,
    title: row.title,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags: row.note_tags.map((nt) => nt.tags),
  }
}

export function useNotes(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: NOTES_KEY,
    queryFn: async (): Promise<Note[]> => {
      const { data, error } = await supabase
        .from('notes')
        .select('*, note_tags(tags(*))')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data as unknown as NoteRow[]).map(toNote)
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
        .select('*, note_tags(tags(*))')
        .single()
      if (error) throw error
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
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  })
}

export function useAddTagToNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ noteId, tagId }: { noteId: string; tagId: string }) => {
      const { error } = await supabase.from('note_tags').insert({ note_id: noteId, tag_id: tagId })
      if (error) throw error
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
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  })
}
