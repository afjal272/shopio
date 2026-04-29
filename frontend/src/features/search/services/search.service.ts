const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function searchProducts(query: string, intent: string[] = ["balanced"]) {
  const res = await fetch(`${BASE_URL}/api/search`, {
    method: "POST", // 🔥 UPDATED
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      intent, // 🔥 NEW
    }),
  })

  if (!res.ok) {
    throw new Error("Failed to fetch")
  }

  return res.json()
}