"use client"

import SearchBar from "@/features/search/components/SearchBar"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"

export default function Home() {
  const { search, loading, data } = useSearch()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-black text-white">
      
      <h1 className="text-3xl font-bold">Shopio AI</h1>

      {/* Search */}
      <SearchBar onSearch={search} />

      {/* Loading */}
      {loading && <p className="text-gray-400">Loading...</p>}

      {/* Results */}
      {data && <Results data={data} />}

    </div>
  )
}