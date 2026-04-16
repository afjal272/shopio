"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SearchBar() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSearch = () => {
    if (!query.trim()) return

    // 🔥 REDIRECT HERE
    router.push(`/search?q=${query}`)
  }

  return (
    <div className="flex gap-2 w-full max-w-md">
      <input
        className="border px-4 py-2 rounded w-full"
        placeholder="e.g. best phone under 20000 for gaming"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        onClick={handleSearch}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Search
      </button>
    </div>
  )
}