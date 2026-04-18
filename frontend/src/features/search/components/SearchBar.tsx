"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SearchBar() {
  const router = useRouter()
  const params = useSearchParams()

  const [query, setQuery] = useState("")

  useEffect(() => {
    const q = params.get("q")
    if (q) setQuery(q)
  }, [params])

  const handleSearch = () => {
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <input
        className="flex-1 border px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-black/20"
        placeholder="e.g. best phone under 20000 for gaming"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        onClick={handleSearch}
        className="bg-black text-white px-5 py-3 rounded-lg hover:opacity-90 transition"
      >
        Search
      </button>
    </div>
  )
}