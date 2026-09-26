import type { Metadata } from "next"
import { Suspense } from "react"

import SearchPageClient from "./SearchPageClient"

type PageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

const normalizeQuery = (value?: string) => {
  const normalized = value?.trim() ?? ""

  if (!normalized) {
    return "products"
  }

  return normalized.slice(0, 100)
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams
  const query = normalizeQuery(params.q)

  return {
    title: `Best ${query} | BeforeChoice`,
    description: `Find the best ${query} using BeforeChoice's AI-powered product decision engine.`,
  }
}

function SearchPageFallback() {
  return (
    <main className="min-h-screen bg-[#fafafc] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Search header skeleton */}
        <div className="mx-auto max-w-3xl">
          <div className="h-14 w-full animate-pulse rounded-2xl bg-[#e9ebef]" />
        </div>

        {/* Query heading skeleton */}
        <div className="mt-10">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-[#e9ebef]" />

          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-[#eef0f3]" />
        </div>

        {/* Results skeleton */}
        <div className="mt-10 space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[24px] border border-[#e7e9ee] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="h-36 w-full animate-pulse rounded-2xl bg-[#f0f1f4] sm:w-36" />

                <div className="flex-1">
                  <div className="h-6 w-3/4 animate-pulse rounded bg-[#e9ebef]" />

                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[#eef0f3]" />

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map(
                      (_, specIndex) => (
                        <div
                          key={specIndex}
                          className="h-16 animate-pulse rounded-xl bg-[#f6f7f9]"
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export default async function Page({
  searchParams,
}: PageProps) {
  const params = await searchParams
  const query =
    params.q?.trim().slice(0, 200) ?? ""

  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageClient initialQuery={query} />
    </Suspense>
  )
}