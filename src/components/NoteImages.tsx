'use client'

import { useRef, useState } from 'react'
import {
  useDeleteNoteImage,
  useNoteImages,
  useUploadNoteImage,
  validateImage,
} from '../hooks/useNoteImages'

interface NoteImagesProps {
  noteId: string
  userId: string
}

export function NoteImages({ noteId, userId }: NoteImagesProps) {
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)

  const { data: images = [], isLoading } = useNoteImages(noteId)
  const upload = useUploadNoteImage()
  const remove = useDeleteNoteImage()

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (list.length === 0) return

    const rejected = list.map(validateImage).filter((m): m is string => m !== null)
    const accepted = list.filter((f) => validateImage(f) === null)
    setErrors(rejected)

    for (const file of accepted) {
      try {
        await upload.mutateAsync({ noteId, userId, file })
      } catch (err) {
        setErrors((prev) => [
          ...prev,
          err instanceof Error ? err.message : `Could not upload ${file.name}.`,
        ])
      }
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const busy = upload.isPending

  return (
    <section
      onDragEnter={(e) => {
        e.preventDefault()
        dragDepth.current += 1
        setDragging(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault()
        dragDepth.current -= 1
        if (dragDepth.current <= 0) setDragging(false)
      }}
      onDrop={onDrop}
      className={`mt-10 rounded-xl border border-dashed p-4 transition-colors ${
        dragging ? 'border-accent bg-accent-wash' : 'border-line bg-transparent'
      }`}
      aria-label="Images attached to this note"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="eyebrow">
          {dragging
            ? 'Drop to attach'
            : isLoading
              ? 'Images'
              : `${images.length} ${images.length === 1 ? 'image' : 'images'}`}
        </span>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[12px] font-medium text-ink transition-colors hover:border-faint hover:bg-shell disabled:opacity-50"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {busy ? 'Adding…' : 'Add image'}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {isLoading ? (
        <p className="text-[12.5px] text-faint">Loading images…</p>
      ) : images.length === 0 ? (
        <p className="text-[12.5px] leading-relaxed text-faint">
          Drag an image here, or use Add image. PNG, JPEG, WebP or GIF, up to 5 MB.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2.5">
          {images.map((img) => (
            <li key={img.id} className="group relative">
              <button
                type="button"
                onClick={() => img.url && setLightbox({ url: img.url, name: img.file_name })}
                className="block h-24 w-24 overflow-hidden rounded-lg border border-line bg-shell"
                title={img.file_name}
              >
                {img.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={img.file_name}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] text-faint">
                    Unavailable
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => remove.mutate({ image: img, noteId })}
                aria-label={`Remove ${img.file_name}`}
                className="absolute -right-1.5 -top-1.5 hidden rounded-full border border-line bg-paper p-1 text-muted shadow-sm transition-colors hover:text-danger group-hover:block"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1" role="alert">
          {errors.map((msg, i) => (
            <li key={i} className="text-[11.5px] text-danger">
              {msg}
            </li>
          ))}
        </ul>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.name}
          onClick={() => setLightbox(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-8"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt={lightbox.name}
            className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close image"
            className="absolute right-6 top-6 rounded-lg bg-paper/90 px-3 py-1.5 text-[12px] font-medium text-ink"
          >
            Close
          </button>
        </div>
      )}
    </section>
  )
}
