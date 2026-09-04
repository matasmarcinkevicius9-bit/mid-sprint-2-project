import { useState } from 'react'
import { useComments, useCreateComment, useDeleteComment } from '../hooks/useComments'

interface CommentsPanelProps {
  noteId: string
  currentUserId: string
  currentUserEmail: string
}

export function CommentsPanel({ noteId, currentUserId, currentUserEmail }: CommentsPanelProps) {
  const [body, setBody] = useState('')
  const { data: comments = [], isLoading } = useComments(noteId)
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    createComment.mutate(
      { noteId, authorId: currentUserId, authorEmail: currentUserEmail, body: trimmed },
      { onSuccess: () => setBody('') },
    )
  }

  return (
    <div className="mt-8 border-t border-neutral-200 pt-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Comments
      </h2>

      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-neutral-400">No comments yet.</p>
      ) : (
        <ul className="mb-4 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md bg-neutral-50 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-neutral-600">{c.author_email}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                  {c.author_id === currentUserId && (
                    <button
                      onClick={() => deleteComment.mutate({ id: c.id, noteId })}
                      className="text-xs text-neutral-400 hover:text-red-600"
                      aria-label="Delete comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-neutral-800">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment..."
          className="w-full resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm"
          rows={3}
        />
        <button
          type="submit"
          disabled={!body.trim() || createComment.isPending}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          Post comment
        </button>
      </form>
    </div>
  )
}
