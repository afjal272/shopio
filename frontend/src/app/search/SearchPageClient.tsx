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

  // 🔥 NEW: intent state
  const [intent, setIntent] = useState<string[]>(["balanced"])

  // 🔥 FIX: hydration safe selected state
  const [selected, setSelected] = useState<string[]>(() => {
    if (typeof window === "undefined") return []

    try {
      const stored = JSON.parse(localStorage.getItem("compare_ids") || "[]")
      if (Array.isArray(stored)) {
        return stored.map((id) => String(id))
      }
    } catch {}

    return []
  })

  // 🔥 FIX: mounted state (CRITICAL for hydration)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ normalize ID always
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
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    if (!queryFromURL || hasSyncedRef.current) return

    setQuery(queryFromURL)
    hasSyncedRef.current = true
  }, [queryFromURL])

  // 🔥 TRIGGER SEARCH
  useEffect(() => {
    if (!query) return

    if (query !== lastQueryRef.current) {
      search(query, intent)
      lastQueryRef.current = query
    }
  }, [query, intent, search])

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="mb-6 md:mb-8 flex justify-center">
          <SearchBar initialValue={query} />
        </div>

        {/* 🔥 INTENT SELECTOR */}
        <div className="flex gap-2 justify-center mb-5 md:mb-6 flex-wrap px-1">
          {["balanced", "gaming", "camera", "battery"].map((type) => (
            <button
              key={type}
              onClick={() => setIntent([type])}
              className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm border transition whitespace-nowrap active:scale-95 ${
                 intent.includes(type)
                   ? "bg-black text-white shadow-md"
                   : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {query && (
          <h1 className="text-lg md:text-xl font-semibold text-black mb-5 md:mb-6 text-center break-words px-2">
            Showing results for "{query}"
          </h1>
        )}

        {/* 🔥 LOADING */}
        {loading === true && (
          <div className="space-y-3 md:space-y-4 p-2 md:p-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {/* 🔥 ERROR */}
        {loading === false && error && (
          <div className="text-center py-10 space-y-3">
            <p className="text-red-500 font-medium">
             {error || "Something went wrong"}
           </p>

            <button
              onClick={() => search(query, intent)}
              className="px-4 py-2 bg-black text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {/* 🔥 RESULTS */}
        {loading === false && !error && data && (
          <div className="mt-5 md:mt-6 flex justify-center">
            <Results
              data={data}
              selected={selected}
              onSelect={toggleSelect}
            />
          </div>
        )}

        {/* 🔥 FINAL COMPARE BUTTON (FIXED) */}
        {mounted && selected.length >= 2 && (
          <button
            onClick={() => {
              localStorage.setItem("compare_ids", JSON.stringify(selected))
              window.dispatchEvent(new Event("compare_update"))

              setTimeout(() => {
                window.location.href = "/compare"
              }, 50)
            }}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-black text-white px-5 md:px-6 py-3 rounded-2xl shadow-xl text-sm md:text-base z-50 active:scale-95 transition"
          >
            Compare ({selected.length}/4)
          </button>
        )}

      </div>
    </div>
  )
}