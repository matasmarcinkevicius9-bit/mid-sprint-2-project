'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tag } from '../types'

const supabase = createClient()

const TAGS_KEY = ['tags']

export function useTags(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: async (): Promise<Tag[]> => {
      const { data, error } = await supabase.from('tags').select('*').order('name', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: options?.enabled ?? true,
  })
}

/** Finds a tag by exact name (case-insensitive) or creates it. */
export async function getOrCreateTag(name: string): Promise<Tag> {
  const trimmed = name.trim()
  const { data: existing, error: findError } = await supabase
    .from('tags')
    .select('*')
    .ilike('name', trimmed)
    .maybeSingle()
  if (findError) throw findError
  if (existing) return existing

  const { data: created, error: createError } = await supabase
    .from('tags')
    .insert({ name: trimmed })
    .select()
    .single()
  if (createError) throw createError
  return created
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
