import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Comment } from '../types'

const commentsKey = (noteId: string | null) => ['comments', noteId]

export function useComments(noteId: string | null) {
  return useQuery({
    queryKey: commentsKey(noteId),
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('note_id', noteId as string)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!noteId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (comment: {
      noteId: string
      authorId: string
      authorEmail: string
      body: string
    }): Promise<Comment> => {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          note_id: comment.noteId,
          author_id: comment.authorId,
          author_email: comment.authorEmail,
          body: comment.body,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: commentsKey(variables.noteId) }),
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; noteId: string }) => {
      const { error } = await supabase.from('comments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: commentsKey(variables.noteId) }),
  })
}
