import SearchPageClient from "./SearchPageClient"

export async function generateMetadata({ searchParams }: any) {
  const params = await searchParams
  const query = params?.q || "products"

  return {
    title: `Best ${query} | Shopio`,
    description: `Find best ${query} using AI decision engine`,
  }
}

// 🔥 FIX: async + await add
export default async function Page({ searchParams }: any) {
  const params = await searchParams
  const query = params?.q || ""

  return <SearchPageClient initialQuery={query} />
}