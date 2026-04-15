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
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-black text-white">
      <h1 className="text-3xl font-bold">Shopio AI</h1>

      {/* Search */}
      <div className="flex gap-2 w-full max-w-md">
        <input
          className="border border-zinc-700 bg-zinc-900 px-4 py-2 rounded w-full outline-none"
          placeholder="e.g. best phone under 20000 for gaming"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="bg-white text-black px-4 py-2 rounded font-medium"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading...</p>}

      {/* NO RESULT */}
      {result && result.best?.score === 0 && (
        <div className="text-red-400 text-sm">
          No suitable product found
        </div>
      )}

      {/* BEST PRODUCT */}
      {result && result.best && result.best.score > 0 && (
        <div className="mt-6 border border-zinc-700 p-5 rounded w-full max-w-md bg-zinc-900">
          <h2 className="text-green-400 font-bold">🏆 Best Choice</h2>

          <h3 className="text-xl font-bold mt-1">
            {result.best.title}
          </h3>

          <p className="text-sm text-gray-400 mt-1">
            Score: {result.best.score} / 100
          </p>

          {/* Score bar */}
          <div className="w-full bg-zinc-700 h-2 rounded mt-2">
            <div
              className="bg-green-500 h-2 rounded"
              style={{ width: `${result.best.score}%` }}
            />
          </div>

          <p className="mt-3 text-sm text-gray-300">
            {result.best.explanation}
          </p>
        </div>
      )}

      {/* TOP 3 */}
      {result?.top3?.length > 0 && (
        <div className="w-full max-w-md">
          <h3 className="text-lg font-semibold mt-4 mb-2">
            Top Recommendations
          </h3>

          <div className="flex flex-col gap-3">
            {result.top3.map((item: any, index: number) => (
              <div
                key={item.id}
                className="border border-zinc-700 p-4 rounded bg-zinc-900"
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold">
                    #{index + 1} {item.title}
                  </p>
                  <p className="text-sm text-gray-400">
                    {item.score}/100
                  </p>
                </div>

                {/* Score bar */}
                <div className="w-full bg-zinc-700 h-2 rounded mt-2">
                  <div
                    className="bg-green-500 h-2 rounded"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}