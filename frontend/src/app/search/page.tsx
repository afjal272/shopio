"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import SearchBar from "@/features/search/components/SearchBar"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"

export default function SearchPage() {
  const params = useSearchParams()
  const query = params.get("q")

  const { search, loading, data } = useSearch()

  useEffect(() => {
    if (query) search(query)
  }, [query])

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        <SearchBar />

        {loading && <p className="mt-6">Loading...</p>}

        {data && (
          <div className="mt-10">
            <Results data={data} />
          </div>
        )}

      </div>
    </div>
  )
}