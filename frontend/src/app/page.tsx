"use client"

import { useState } from "react"

export default function Home() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query) return

    setLoading(true)

    try {
      const res = await fetch("http://localhost:5000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      })

      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold">Shopio AI</h1>

      <div className="flex gap-2 w-full max-w-md">
        <input
          className="border px-4 py-2 rounded w-full"
          placeholder="e.g. best phone under 20000 for gaming"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {result && (
        <div className="mt-6 border p-4 rounded w-full max-w-md">
          <h2 className="text-xl font-semibold">
            {result.best.title}
          </h2>

          <p>Score: {result.best.score}</p>
          <p>Confidence: {result.best.confidence}</p>

          <p className="mt-2 text-sm text-gray-600">
            {result.best.explanation}
          </p>
        </div>
      )}
    </div>
  )
}