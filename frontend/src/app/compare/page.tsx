"use client"

import { useEffect, useMemo, useState } from "react"
import { ProductItem } from "@/types/search"

export default function ComparePage() {

  type ComparisonType = {
    winner: string
    reasons: string[]
    scores: { id: string; score: number }[]
    intent?: string[]
    weaknesses?: { id: string; points: string[] }[]
  }

  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [comparison, setComparison] = useState<ComparisonType | null>(null)
  const [loading, setLoading] = useState(true)

  const getTags = (p: ProductItem, score?: number) => {
    const tags: string[] = []

    if ((p.specs?.processorScore || 0) >= 8) tags.push("🔥 Gaming")
    if ((p.specs?.battery || 0) >= 5500) tags.push("🔋 Battery")
    if ((p.rating || 0) >= 4.3) tags.push("📸 Camera")
    if ((score || 0) >= 8) tags.push("💰 Value")

    return tags.slice(0, 2)
  }

  // 🔥 UPDATED (normalize using maxScore)
  
  const getScorePercent = (score: number) => {
  return score > 100 ? 100 : score < 0 ? 0 : score
}


  const loadProducts = async () => {
    try {
      let ids: string[] = []

      try {
        const raw = localStorage.getItem("compare_ids")
        ids = raw ? JSON.parse(raw) : []
      } catch {
        ids = []
      }

      if (!Array.isArray(ids) || ids.length < 2) {
        setProducts([])
        setComparison(null)
        setLoading(false)
        return
      }

      const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

const res = await fetch(`${BASE_URL}/api/search/compare`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    productIds: ids.slice(0, 4),
    intent: ["balanced"],
  }),
})

      if (!res.ok) {
        setProducts([])
        setComparison(null)
        return
      }

      const data = await res.json()

      setProducts(Array.isArray(data.products) ? data.products : [])
      setComparison(data.comparison ?? null)

    } catch {
      setProducts([])
      setComparison(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadProducts()

    window.addEventListener("compare_update", loadProducts)
    return () => window.removeEventListener("compare_update", loadProducts)
  }, [])

  const scoreMap = useMemo(() => {
    return new Map(
      (comparison?.scores || []).map((s) => [
        String(s.id),
        Number(s.score || 0)
      ])
    )
  }, [comparison])

  const sorted = useMemo(
    () =>
      [...products].sort(
        (a, b) =>
          Number(scoreMap.get(String(b.id)) || 0) -
          Number(scoreMap.get(String(a.id)) || 0)
      ),
    [products, scoreMap]
  )

  const winner =
    products.find((p) => String(p.id) === String(comparison?.winner)) || sorted[0]

  const intent = comparison?.intent || ["balanced"]

  const isImportant = (label: string) => {
    if (intent.includes("gaming") && label === "Processor") return true
    if (intent.includes("battery") && label === "Battery") return true
    if (intent.includes("camera") && label === "Score") return true
    return false
  }

  if (!mounted) return null

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>
  }

  if (products.length < 2) {
    return <div className="p-10 text-center">Select at least 2 products</div>
  }

  const minPrice = Math.min(...products.map((x) => Number(x.price || 0)))

  const maxScore = Math.max(
    ...products.map((p) => Number(scoreMap.get(String(p.id)) || 0))
  )

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12">

      {/* 🏆 HERO */}
      <div className="bg-gradient-to-r from-green-50 to-white border rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center gap-6">

        <img
          src={winner?.image || "https://via.placeholder.com/150"}
          className="w-40 h-40 object-contain bg-white rounded-xl p-3"
        />

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-green-700">
            🏆 {winner?.title}
          </h2>

          <p className="text-lg font-semibold mt-1 text-green-600">
            ₹{winner?.price}
          </p>

          <p className="text-sm mt-2 text-gray-600">
            Score: {Number(scoreMap.get(String(winner?.id)) || 0)}
          </p>

          {comparison?.reasons && comparison.reasons.length > 0 && (
            <div className="mt-3 bg-green-50 border border-green-200 p-3 rounded-lg">
              {comparison.reasons.map((r: string, i: number) => (
                <div key={i} className="text-sm">
                  ✔ {r}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🔥 PRODUCT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {sorted.map((p) => {
        const score = Number(scoreMap.get(String(p.id)) || 0)

          console.log("CURRENT ID:", p.id)

              if (comparison?.weaknesses) {
               const match = comparison.weaknesses.find(
               (w) => String(w.id) === String(p.id)
             )

             console.log("MATCHED WEAKNESS:", match)
             }

             return (

            <div
              key={p.id}
              className={`rounded-xl p-4 bg-white shadow-md border hover:shadow-lg transition ${
                p.id === winner?.id ? "ring-2 ring-green-400" : ""
              }`}
            >
              <div className="relative">
                <img
                  src={p.image || "https://via.placeholder.com/150"}
                  className="w-full h-36 object-contain bg-gray-50 rounded-lg p-2"
                />

                {p.id === winner?.id && (
                  <span className="absolute top-2 right-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                    Best
                  </span>
                )}

                {Number(p.price) === minPrice && (
                  <span className="absolute top-2 left-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    Cheapest
                  </span>
                )}
              </div>

              <h3 className="font-semibold mt-3 text-sm">{p.title}</h3>

              <div className="flex flex-wrap gap-1 mt-2">
                {getTags(p, score).map((tag, i) => (
                  <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="font-bold mt-2">₹{p.price}</p>

              {/* PROGRESS BAR */}
<div className="mt-2">
  <div className="h-2 bg-gray-200 rounded overflow-hidden">
    <div
  className={`h-2 rounded ${
    score > 80
      ? "bg-green-500"
      : score > 60
      ? "bg-yellow-500"
      : "bg-red-500"
  }`}
  style={{
    width: `${getScorePercent(score)}%`
  }}
/>
  </div>
  <p className="text-xs text-gray-500 mt-1">
    Score: {score}
  </p>
</div>

{/* 🔥 WEAKNESSES */}
<div className="mt-3 text-left space-y-1">
  {(() => {
    const weaknessItem = (comparison?.weaknesses || []).find(
      (w) => String(w.id) === String(p.id)
    )

    return weaknessItem?.points?.slice(0, 2).map((point, i) => (
      <div
        key={i}
        className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded"
      >
        ⚠ {point}
      </div>
    ))
  })()}
</div>

</div>
)
})}
</div>


      {/* 📊 TABLE */}
      <div className="bg-white border rounded-xl overflow-x-auto text-sm">

        <div className="grid grid-cols-5 bg-gray-100 p-3 font-semibold">
          <div>Spec</div>
          {sorted.map((p) => (
            <div key={p.id}>{p.title}</div>
          ))}
        </div>

        {[
          { label: "Price", get: (p: ProductItem) => `₹${p.price}` },
          { label: "Score", get: (p: ProductItem) => scoreMap.get(String(p.id)) || 0 },
          { label: "RAM", get: (p: ProductItem) => `${p.specs?.ram ?? "-"} GB` },
          { label: "Battery", get: (p: ProductItem) => `${p.specs?.battery ?? "-"} mAh` },
          { label: "Processor", get: (p: ProductItem) => p.specs?.processorScore ?? "-" },
        ].map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-5 p-3 border-t ${
              isImportant(row.label) ? "bg-yellow-50 font-semibold" : ""
            }`}
          >
            <div>{row.label}</div>
            {sorted.map((p) => (
              <div key={p.id}>{String(row.get(p) ?? "-")}</div>
            ))}
          </div>
        ))}
      </div>

    </div>
  )
}