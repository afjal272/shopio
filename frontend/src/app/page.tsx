"use client"

import Hero from "@/components/Hero"
import Features from "@/components/Features"
import HowItWorks from "@/components/HowItWorks"
import Trust from "@/components/Trust"
import CTA from "@/components/CTA"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"

export default function Home() {
  const { search, loading, data } = useSearch()

  return (
    <div className="min-h-screen bg-white">

      {/* HERO */}
      <Hero onSearch={search} />

      {/* FEATURES */}
      <Features />

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* TRUST */}
      <Trust />

      {/* CTA */}
      <CTA />

      {/* RESULTS SECTION (IMPORTANT FIX) */}
      {(loading || data) && (
        <section className="w-full py-20 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4">

            {loading && (
              <p className="text-gray-500 text-center">
                Loading...
              </p>
            )}

            {data && <Results data={data} />}

          </div>
        </section>
      )}

    </div>
  )
}