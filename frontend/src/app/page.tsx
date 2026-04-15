"use client"

import Hero from "@/components/Hero"
import Features from "@/components/Features"
import HowItWorks from "@/components/HowItWorks"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"

export default function Home() {
  const { search, loading, data } = useSearch()

  return (
    <div className="min-h-screen">

      {/* HERO */}
      <Hero onSearch={search} />

      {/* FEATURES */}
      <Features />

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* RESULTS */}
      <div className="max-w-3xl mx-auto px-4 pb-16">

        {loading && (
          <p className="text-gray-400 mt-6">Loading...</p>
        )}

        {data && (
          <div className="mt-10">
            <Results data={data} />
          </div>
        )}

      </div>

    </div>
  )
}