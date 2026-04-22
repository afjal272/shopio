"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

import SearchBar from "@/features/search/components/SearchBar"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"
import Skeleton from "@/components/ui/Skeleton"

export default function SearchPageClient() {
  const params = useSearchParams()
  const query = params.get("q") || ""

  const { search, loading, data, error } = useSearch()

  const lastQueryRef = useRef("")

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
          <SearchBar />
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
            <Results data={data} />
          </div>
        )}

      </div>
    </div>
  )
}