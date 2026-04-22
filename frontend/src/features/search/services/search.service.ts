const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function searchProducts(query: string) {
  const res = await fetch(
    `${BASE_URL}/api/search?q=${encodeURIComponent(query)}`
  )

  if (!res.ok) {
    throw new Error("Failed to fetch")
  }

  return res.json()
}