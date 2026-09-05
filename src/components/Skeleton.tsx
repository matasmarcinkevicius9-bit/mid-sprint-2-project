'use client'

/** A single shimmering placeholder bar. */
function Bar({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton ${className}`} aria-hidden="true">
      <div className="skeleton-sheen" />
    </div>
  )
}

/**
 * Placeholder rows shaped like real note rows, so the list keeps its
 * height and rhythm while notes are being fetched and never flashes an
 * empty pane.
 */
export function NoteListSkeleton({ rows = 6 }: { rows?: number }) {
  const widths = ['62%', '78%', '54%', '70%', '46%', '66%']
  return (
    <div role="status" aria-label="Loading notes">
      <span className="sr-only">Loading notes…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-line-soft px-5 py-4">
          <Bar className="h-[13px]" />
          <div className="mt-2.5" style={{ width: widths[i % widths.length] }}>
            <Bar className="h-[11px]" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Placeholder for the sidebar's collections and tags. */
export function SidebarSkeleton() {
  return (
    <div role="status" aria-label="Loading collections and tags" className="space-y-7">
      <span className="sr-only">Loading collections and tags…</span>
      <div className="space-y-2">
        {['70%', '52%', '61%'].map((w, i) => (
          <div key={i} style={{ width: w }}>
            <Bar className="h-[15px]" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['54px', '72px', '46px', '63px'].map((w, i) => (
          <div key={i} style={{ width: w }}>
            <Bar className="h-[20px] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
