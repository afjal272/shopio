"use client"

import SearchBar from "@/features/search/components/SearchBar"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"

export default function Home() {
  const { search, loading, data } = useSearch()

  return (
   <div className="min-h-screen bg-black text-white flex flex-col items-center pt-24 px-4">
      
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