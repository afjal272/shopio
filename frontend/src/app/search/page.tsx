import { Suspense } from "react"
import SearchPageClient from "./SearchPageClient"

export function generateMetadata({ searchParams }: any) {
  const query = searchParams?.q || "products"

  return {
    title: `Best ${query} | Shopio`,
    description: `Find best ${query} using AI decision engine`,
  }
}

export default function Page({ searchParams }: any) {
  const query = searchParams?.q || ""

  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SearchPageClient initialQuery={query} />
    </Suspense>
  )
}