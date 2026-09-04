import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Collection } from '../types'

const COLLECTIONS_KEY = ['collections']

export function useCollections(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: COLLECTIONS_KEY,
    queryFn: async (): Promise<Collection[]> => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: options?.enabled ?? true,
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string): Promise<Collection> => {
      const { data, error } = await supabase
        .from('collections')
        .insert({ name })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  })
}

export function useRenameCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('collections').update({ name }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('collections').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
