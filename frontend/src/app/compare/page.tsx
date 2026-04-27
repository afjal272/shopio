"use client"

import { useEffect, useMemo, useState } from "react"
import { ProductItem } from "@/types/search"

export default function ComparePage() {

  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [comparison, setComparison] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadProducts = async () => {
    try {
      // ✅ SAFE PARSE
      let ids: string[] = []
      try {
        const raw = localStorage.getItem("compare_ids")
        ids = raw ? JSON.parse(raw) : []
      } catch {
        console.error("❌ Invalid compare_ids in localStorage")
        ids = []
      }

      console.log("FRONTEND IDS:", ids)

      if (!Array.isArray(ids) || ids.length < 2) {
        setProducts([])
        setComparison(null)
        setLoading(false)
        return
      }

      const res = await fetch("http://localhost:5000/api/search/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ productIds: ids.slice(0, 4) })
      })

      // 🔥 CRITICAL FIX
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error("❌ API ERROR:", errorData)
        setProducts([])
        setComparison(null)
        return
      }

      const data = await res.json()

      console.log("API RESPONSE:", data)

      setProducts(Array.isArray(data.products) ? data.products : [])
      setComparison(data.comparison ?? null)

    } catch (err) {
      console.error("❌ FETCH FAILED:", err)
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

  const sorted = useMemo(
    () => [...products].sort((a, b) => (b.score || 0) - (a.score || 0)),
    [products]
  )

  const winner =
    products.find((p) => p.id === comparison?.winner) || sorted[0]

  if (!mounted) return null

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>
  }

  if (products.length < 2) {
    return <div className="p-10 text-center">Select at least 2 products</div>
  }

  const minPrice = Math.min(...products.map((x) => x.price || 0))

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10">

      <h2 className="text-3xl font-bold">
        🏆 {winner?.title} is the best choice
      </h2>

      {comparison?.reasons?.length > 0 && (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg mb-3">
            Why this is the best choice
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {comparison.reasons.map((r: string, i: number) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className={`border rounded-xl p-4 bg-white shadow-sm relative ${
              p.id === winner?.id ? "border-green-500" : ""
            }`}
          >
            {p.id === winner?.id && (
              <span className="absolute top-2 right-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                Best
              </span>
            )}

            {p.price === minPrice && (
              <span className="absolute top-2 left-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                Cheapest
              </span>
            )}

            <img
              src={p.image || "/placeholder.png"}
              className="w-full h-40 object-contain"
            />

            <h3 className="font-semibold mt-3 text-sm">{p.title}</h3>
            <p className="mt-1 font-bold">₹{p.price}</p>

            <p className="text-sm text-gray-500">
              Score: {p.score}
            </p>
          </div>
        ))}
      </div>

      <div className="border rounded-xl overflow-hidden text-sm bg-white">
        <div className="grid grid-cols-5 bg-gray-100 p-3 font-semibold">
          <div>Spec</div>
          {products.map((p) => (
            <div key={p.id}>{p.title}</div>
          ))}
        </div>

        {[
          { label: "Price", get: (p: ProductItem) => `₹${p.price}` },
          { label: "Score", get: (p: ProductItem) => p.score },
          { label: "RAM", get: (p: ProductItem) => `${p.breakdown?.ram ?? "-"} GB` },
          { label: "Battery", get: (p: ProductItem) => `${p.breakdown?.battery ?? "-"} mAh` },
          { label: "Processor", get: (p: ProductItem) => p.breakdown?.processor ?? "-" },
        ].map((row, i) => (
          <div key={i} className="grid grid-cols-5 p-3 border-t">
            <div>{row.label}</div>
            {products.map((p) => (
              <div key={p.id}>{row.get(p)}</div>
            ))}
          </div>
        ))}
      </div>

    </div>
  )
}