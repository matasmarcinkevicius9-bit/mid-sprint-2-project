interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex items-center border-b border-neutral-200 bg-white px-4 py-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
        placeholder="Search all notes by title, content, or tag..."
        className="w-full max-w-md rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
      />
      {value && (
        <span className="ml-2 text-xs text-neutral-400">searching all notes</span>
      )}
    </div>
  )
}
