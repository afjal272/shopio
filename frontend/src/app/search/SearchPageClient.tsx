"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import SearchBar from "@/features/search/components/SearchBar"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"
import Skeleton from "@/components/ui/Skeleton"

export default function SearchPageClient({ initialQuery = "" }: { initialQuery?: string }) {
  const params = useSearchParams()
  const queryFromURL = params.get("q") || ""

  const [query, setQuery] = useState(initialQuery || queryFromURL)

  const { search, loading, data, error } = useSearch()

  const lastQueryRef = useRef("")

  // 🔥 compare state
  const [selected, setSelected] = useState<string[]>([])

  // 🔥 NEW: intent state
  const [intent, setIntent] = useState<string[]>(["balanced"])

  // ✅ FIX 1: restore from localStorage (CRITICAL)
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("compare_ids") || "[]")

      if (Array.isArray(stored)) {
        setSelected(stored.map((id: any) => String(id)))
      }
    } catch {
      setSelected([])
    }
  }, [])

  // ✅ FIX 2: normalize ID always
  const toggleSelect = (id: string) => {
    const normalized = String(id)

    setSelected((prev) => {
      if (prev.includes(normalized)) {
        return prev.filter((i) => i !== normalized)
      }

      if (prev.length >= 4) return prev

      return [...prev, normalized]
    })
  }

  // 🔥 SYNC URL → STATE
  useEffect(() => {
    if (queryFromURL && queryFromURL !== query) {
      setQuery(queryFromURL)
    }
  }, [queryFromURL])

  // 🔥 TRIGGER SEARCH (UPDATED with intent)
  useEffect(() => {
    if (!query) return

    if (query !== lastQueryRef.current) {
      search(query, intent) // 🔥 UPDATED
      lastQueryRef.current = query
    }
  }, [query, intent, search])

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8 flex justify-center">
          <SearchBar initialValue={query} />
        </div>

        {/* 🔥 NEW: INTENT SELECTOR UI */}
        <div className="flex gap-2 justify-center mb-6 flex-wrap">
          {["balanced", "gaming", "camera", "battery"].map((type) => (
            <button
              key={type}
              onClick={() => setIntent([type])}
              className={`px-4 py-2 rounded-full text-sm border ${
                intent.includes(type)
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {query && (
          <h1 className="text-xl font-semibold text-black mb-6 text-center">
            Showing results for "{query}"
          </h1>
        )}

        {/* 🔥 LOADING */}
        {loading && (
          <div className="space-y-4 p-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {/* 🔥 ERROR */}
        {!loading && error && (
          <div className="text-center py-10 space-y-3">
            <p className="text-red-500 font-medium">
              Something went wrong
            </p>

            <button
              onClick={() => search(query, intent)} // 🔥 UPDATED
              className="px-4 py-2 bg-black text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {/* 🔥 RESULTS */}
        {!loading && !error && data && (
          <div className="mt-6 flex justify-center">
            <Results
              data={data}
              selected={selected}
              onSelect={toggleSelect}
            />
          </div>
        )}

        {/* 🔥 FINAL COMPARE BUTTON */}
        {selected.length >= 2 && (
          <button
            onClick={() => {
              localStorage.setItem("compare_ids", JSON.stringify(selected))
              window.dispatchEvent(new Event("compare_update"))

              setTimeout(() => {
                window.location.href = "/compare"
              }, 50)
            }}
            className="fixed bottom-6 right-6 bg-black text-white px-6 py-3 rounded-lg shadow-lg"
          >
            Compare ({selected.length}/4)
          </button>
        )}

      </div>
    </div>
  )
}