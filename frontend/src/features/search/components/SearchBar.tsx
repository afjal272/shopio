"use client"

import { useState } from "react"

export default function SearchBar({ onSearch }: any) {
  const [query, setQuery] = useState("")

  return (
    <div className="flex gap-2 w-full max-w-md">
      <input
        className="border px-4 py-2 rounded w-full"
        placeholder="e.g. best phone under 20000 for gaming"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        onClick={() => onSearch(query)}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Search
      </button>
    </div>
  )
}