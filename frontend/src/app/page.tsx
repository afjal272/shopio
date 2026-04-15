"use client"

import Hero from "@/components/Hero"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"

export default function Home() {
  const { search, loading, data } = useSearch()

  return (
    <div className="min-h-screen">
      <Hero onSearch={search} />

      <div className="max-w-3xl mx-auto px-4 pb-16">
        {loading && (
          <p className="text-gray-400">Loading...</p>
        )}

        {data && <Results data={data} />}
      </div>
    </div>
  )
}