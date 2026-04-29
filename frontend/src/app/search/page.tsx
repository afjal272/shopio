import { Suspense } from "react"
import SearchPageClient from "./SearchPageClient"

type PageProps = {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: PageProps) {
  const params = await searchParams
  const query = params.q || "products"

  return {
    title: `Best ${query} | Shopio`,
    description: `Find best ${query} using AI decision engine`,
  }
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams
  const query = params.q || ""

  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SearchPageClient initialQuery={query} />
    </Suspense>
  )
}