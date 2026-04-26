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

  // 🔥 NEW: local query state (source of truth)
  const [query, setQuery] = useState(initialQuery || queryFromURL)

  const { search, loading, data, error } = useSearch()

  const lastQueryRef = useRef("")

  // 🔥 NEW: compare state
  const [selected, setSelected] = useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id)
      }

      if (prev.length >= 2) return prev

      return [...prev, id]
    })
  }

  // 🔥 SYNC URL → STATE
  useEffect(() => {
    if (queryFromURL && queryFromURL !== query) {
      setQuery(queryFromURL)
    }
  }, [queryFromURL])

  // 🔥 TRIGGER SEARCH
  useEffect(() => {
    if (!query) return

    if (query !== lastQueryRef.current) {
      search(query)
      lastQueryRef.current = query
    }
  }, [query, search])

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8 flex justify-center">
          <SearchBar initialValue={query} />
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
              onClick={() => search(query)}
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
              selected={selected}                // 🔥 ADD
              onSelect={toggleSelect}           // 🔥 ADD
            />
          </div>
        )}

        {/* 🔥 COMPARE BUTTON */}
        {selected.length === 2 && (
          <button
            onClick={() => {
              localStorage.setItem("compare_ids", JSON.stringify(selected))
              window.location.href = "/compare"
            }}
            className="fixed bottom-6 right-6 bg-black text-white px-6 py-3 rounded-lg shadow-lg"
          >
            Compare
          </button>
        )}

      </div>
    </div>
  )
}