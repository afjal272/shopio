export async function searchProducts(query: string) {
  const res = await fetch(
    `http://localhost:5000/api/search?q=${encodeURIComponent(query)}`
  )

  if (!res.ok) {
    throw new Error("Failed to fetch")
  }

  return res.json()
}