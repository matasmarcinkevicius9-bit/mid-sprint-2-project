import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { NoteShare } from '../types'

const sharesKey = (noteId: string | null) => ['note_shares', noteId]

export function useNoteShares(noteId: string | null) {
  return useQuery({
    queryKey: sharesKey(noteId),
    queryFn: async (): Promise<NoteShare[]> => {
      const { data, error } = await supabase
        .from('note_shares')
        .select('*')
        .eq('note_id', noteId as string)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!noteId,
  })
}

export function useShareNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ noteId, email }: { noteId: string; email: string }) => {
      const { error } = await supabase.rpc('share_note_by_email', {
        p_note_id: noteId,
        p_email: email,
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: sharesKey(variables.noteId) }),
  })
}

export function useRevokeShare() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; noteId: string }) => {
      const { error } = await supabase.from('note_shares').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: sharesKey(variables.noteId) }),
  })
}
