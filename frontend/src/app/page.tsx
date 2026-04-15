"use client"

import SearchBar from "@/features/search/components/SearchBar"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"

export default function Home() {
  const { search, loading, data } = useSearch()

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 px-4">

      {/* HERO */}
      <div className="text-center">
        <h1 className="text-4xl font-bold">Shopio AI</h1>
        <p className="text-gray-500 mt-2">
          Find the best products instantly
        </p>
      </div>

      {/* Search */}
      <div className="mt-6 w-full max-w-xl">
        <SearchBar onSearch={search} />
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-gray-400 mt-6">Loading...</p>
      )}

      {/* Results */}
      {data && (
        <div className="mt-10 w-full max-w-2xl">
          <Results data={data} />
        </div>
      )}

    </div>
  )
}