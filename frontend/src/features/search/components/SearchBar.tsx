"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SearchBar({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter()
  const params = useSearchParams()

  const [query, setQuery] = useState(initialValue || "")
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // 🔥 NEW: dynamic suggestions
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([])

  // 🔥 NEW: keyboard navigation
  const [activeIndex, setActiveIndex] = useState(-1)

  // 🔥 NEW: recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // 🔥 NEW: click tracking data
  const [clickData, setClickData] = useState<Record<string, number>>({})

  const suggestions = [
    "best gaming phone",
    "best phone under 20000",
    "best camera phone",
    "best laptop for coding",
  ]

  // 🔥 LOAD recent searches
  useEffect(() => {
    const stored = localStorage.getItem("recent_searches")
    if (stored) {
      setRecentSearches(JSON.parse(stored))
    }

    // 🔥 LOAD click data
    const clicks = localStorage.getItem("search_clicks")
    if (clicks) {
      setClickData(JSON.parse(clicks))
    }
  }, [])

  // 🔥 SAVE recent searches
  const saveRecent = (value: string) => {
    let updated = [value, ...recentSearches.filter((v) => v !== value)]
    updated = updated.slice(0, 5)

    setRecentSearches(updated)
    localStorage.setItem("recent_searches", JSON.stringify(updated))
  }

  // 🔥 NEW: track click
  const trackClick = (value: string) => {
    const updated = {
      ...clickData,
      [value]: (clickData[value] || 0) + 1
    }

    setClickData(updated)
    localStorage.setItem("search_clicks", JSON.stringify(updated))
  }

  // 🔥 FIX: query sync + loading reset
  useEffect(() => {
    const q = params.get("q")

    if (q) {
      setQuery(q)
    }

    setLoading(false)
  }, [params])

  // 🔥 NEW: debounce + dynamic suggestions
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!query || query.length < 2) {
        setDynamicSuggestions([])
        return
      }

      const generated = [
        `${query} under 15000`,
        `${query} under 20000`,
        `best ${query}`,
        `${query} with 8GB RAM`,
        `${query} for gaming`,
      ]

      setDynamicSuggestions(generated)
      setActiveIndex(-1)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  const handleSearch = () => {
    if (!query.trim()) return

    setLoading(true)
    setShowSuggestions(false)

    saveRecent(query)
    trackClick(query) // 🔥 ADD

    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleSelect = (value: string) => {
    setQuery(value)
    setShowSuggestions(false)
    setLoading(true)

    saveRecent(value)
    trackClick(value) // 🔥 ADD

    router.push(`/search?q=${encodeURIComponent(value)}`)
  }

  // 🔥 MERGE + RANKING (NEW)
  const filteredSuggestions = Array.from(
    new Set([
      ...recentSearches,
      ...suggestions.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase())
      ),
      ...dynamicSuggestions
    ])
  )
  .sort((a, b) => (clickData[b] || 0) - (clickData[a] || 0)) // 🔥 KEY
  .slice(0, 8)

  // 🔥 NEW: highlight function
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const regex = new RegExp(`(${query})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="font-semibold text-black">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  return (
    <div className="relative w-full flex items-center gap-2">
      <input
        className="flex-1 border px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
        placeholder="e.g. best phone under 20000 for gaming"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setShowSuggestions(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 150)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (activeIndex >= 0) {
              handleSelect(filteredSuggestions[activeIndex])
            } else {
              handleSearch()
            }
          }

          if (e.key === "ArrowDown") {
            e.preventDefault()
            setActiveIndex((prev) =>
              prev < filteredSuggestions.length - 1 ? prev + 1 : prev
            )
          }

          if (e.key === "ArrowUp") {
            e.preventDefault()
            setActiveIndex((prev) =>
              prev > 0 ? prev - 1 : -1
            )
          }
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
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border rounded-lg shadow-md z-10">

          {/* 🔥 RECENT LABEL */}
          {recentSearches.length > 0 && (
            <div className="px-4 py-2 text-xs text-gray-400">
              Recent searches
            </div>
          )}

          {filteredSuggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => handleSelect(s)}
              className={`px-4 py-2 cursor-pointer text-sm ${
                i === activeIndex
                  ? "bg-gray-200"
                  : "hover:bg-gray-100"
              }`}
            >
              {highlightMatch(s, query)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}