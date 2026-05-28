const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"


export async function searchProducts(
  query: string,
  intent: string[] = ["balanced"] // future use, abhi unused
) {
  const url = `${BASE_URL}/api/search?q=${encodeURIComponent(query)}`

  const res = await fetch(url, {
    method: "GET",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Failed to fetch (${res.status}) ${text}`)
  }

  return res.json()
}