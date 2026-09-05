/**
 * Supabase returns plain error objects, not Error instances. Throwing them
 * raw means anything that stringifies the value shows "[object Object]"
 * instead of a message, so normalise them at the boundary.
 */
export interface SupabaseLikeError {
  message?: string
  code?: string
  details?: string | null
  hint?: string | null
}

export function toError(error: SupabaseLikeError | null, fallback = 'Something went wrong.') {
  const err = new Error(error?.message || fallback)
  if (error?.code) err.name = `SupabaseError(${error.code})`
  return err
}

/** Postgres unique-constraint violation. */
export const UNIQUE_VIOLATION = '23505'
