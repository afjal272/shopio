"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SearchBar() {
  const router = useRouter()
  const params = useSearchParams()

  const [query, setQuery] = useState("")

  // 🔥 sync URL → input
  useEffect(() => {
    const q = params.get("q")
    if (q) setQuery(q)
  }, [params])

  const handleSearch = () => {
    if (!query.trim()) return

    router.push(`/search?q=${encodeURIComponent(query)}`)
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