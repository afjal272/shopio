"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SearchBar() {
  const router = useRouter()
  const params = useSearchParams()

  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions = [
    "best gaming phone",
    "best phone under 20000",
    "best camera phone",
    "best laptop for coding",
  ]

  // 🔥 FIX: query sync + loading reset
  useEffect(() => {
    const q = params.get("q")

    if (q) {
      setQuery(q)
    }

    // 🔥 IMPORTANT: reset loading after route change
    setLoading(false)

  }, [params])

  const handleSearch = () => {
    if (!query.trim()) return

    setLoading(true)
    setShowSuggestions(false)

    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleSelect = (value: string) => {
    setQuery(value)
    setShowSuggestions(false)

    // 🔥 also trigger loading for consistency
    setLoading(true)

    router.push(`/search?q=${encodeURIComponent(value)}`)
  }

  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="relative w-full flex items-center gap-2">
      <input
        className="flex-1 border px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
        placeholder="e.g. best phone under 20000 for gaming"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setShowSuggestions(true)
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch()
        }}
      />

      <button
        onClick={handleSearch}
        disabled={loading}
        className="bg-black text-white px-5 py-3 rounded-lg hover:opacity-90 active:scale-95 transition disabled:opacity-60"
      >
        {loading ? "..." : "Search"}
      </button>

      {/* 🔥 Suggestions Dropdown */}
      {showSuggestions && query.length > 1 && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border rounded-lg shadow-md z-10">
          {filteredSuggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => handleSelect(s)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}