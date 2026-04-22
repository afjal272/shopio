"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

import SearchBar from "@/features/search/components/SearchBar"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"
import Skeleton from "@/components/ui/Skeleton"

/* 🔥 SEO (App Router way) */
export async function generateMetadata({ searchParams }: any) {
  const query = searchParams?.q || "products"

  return {
    title: `Best ${query} | Shopio`,
    description: `Find best ${query} using AI decision engine`,
  }
}

export default function SearchPage() {
  const params = useSearchParams()
  const query = params.get("q") || ""

  const { search, loading, data } = useSearch()

  useEffect(() => {
    if (query) {
      search(query)
    }
  }, [query])

  return (
    <div className="min-h-screen bg-white py-16 px-4">

      <div className="max-w-4xl mx-auto">

        {/* 🔥 TOP SEARCH */}
        <div className="mb-8 flex justify-center">
          <SearchBar />
        </div>

        {/* 🔥 QUERY TITLE */}
        {query && (
          <h1 className="text-xl font-semibold text-black mb-6 text-center">
            Showing results for "{query}"
          </h1>
        )}

        {/* 🔥 LOADING (fixed) */}
        {loading && (
          <div className="space-y-4 p-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {/* 🔥 RESULTS */}
        {!loading && data && (
          <div className="mt-6 flex justify-center">
            <Results data={data} />
          </div>
        )}

      </div>
    </div>
  )
}