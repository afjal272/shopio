export async function searchProducts(query: string) {
  const res = await fetch("http://localhost:5000/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    throw new Error("Failed to fetch")
  }

  return res.json()
}