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
              selected={selected}
              onSelect={toggleSelect}
            />
          </div>
        )}

        {/* 🔥 FINAL COMPARE BUTTON */}
        {selected.length >= 2 && (
          <button
            onClick={() => {
              // save ids
              localStorage.setItem("compare_ids", JSON.stringify(selected))

              // sync event (IMPORTANT)
              window.dispatchEvent(new Event("compare_update"))

              // slight delay to avoid race condition
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