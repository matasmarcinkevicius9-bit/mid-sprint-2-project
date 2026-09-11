'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toError, UNIQUE_VIOLATION } from '@/lib/supabase/error'
import type { Tag } from '../types'

const supabase = createClient()

const TAGS_KEY = ['tags']

export function useTags(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: async (): Promise<Tag[]> => {
      const { data, error } = await supabase.from('tags').select('*').order('name', { ascending: true })
      if (error) throw toError(error)
      return data
    },
    enabled: options?.enabled ?? true,
  })
}

/**
 * ilike() takes a LIKE pattern, not a literal, so `%` and `_` inside a tag
 * name act as wildcards: typing `%` would match some unrelated existing tag
 * and silently attach that one instead of creating the tag that was typed.
 * Escape them, and the escape character itself, to match the name literally.
 */
function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

/** Finds a tag by exact name (case-insensitive) or creates it. */
export async function getOrCreateTag(name: string): Promise<Tag> {
  const trimmed = name.trim()

  const findExisting = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .ilike('name', escapeLikePattern(trimmed))
      .limit(1)
    if (error) throw toError(error)
    const match = (data?.[0] as Tag | undefined) ?? null
    // The lookup is a pattern match, so confirm the name really is the same
    // one before treating it as an existing tag.
    if (!match || match.name.toLowerCase() !== trimmed.toLowerCase()) return null
    return match
  }

  const existing = await findExisting()
  if (existing) return existing

  const { data: created, error: createError } = await supabase
    .from('tags')
    .insert({ name: trimmed })
    .select()
    .single()

  // Two rapid submits can both miss the lookup above and race to insert.
  // The unique constraint stops the duplicate; treat that as "already
  // exists" and return the winner rather than surfacing an error.
  if (createError?.code === UNIQUE_VIOLATION) {
    const raced = await findExisting()
    if (raced) return raced
  }
  if (createError) throw toError(createError)
  return created
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id)
      if (error) throw toError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
