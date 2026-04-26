"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import ResultCard from "@/features/search/components/ResultCard"
import { ProductItem } from "@/types/search"

export default function SavedPage() {
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])

  // 🔥 load saved ids
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("saved_products") || "[]")
    setSavedIds(stored)
  }, [])

  // 🔥 load products from last results
  useEffect(() => {
    if (savedIds.length === 0) {
      setProducts([])
      return
    }

    const allProducts: ProductItem[] = JSON.parse(
      localStorage.getItem("last_results") || "[]"
    )

    const filtered = allProducts.filter((p) =>
      savedIds.includes(p.id)
    )

    // ❌ OLD (galat tha)
    // filtered.sort((a, b) => (b.score || 0) - (a.score || 0))

    // ✅ NEW: latest saved first
    const ordered = savedIds
      .slice()
      .reverse()
      .map((id) => filtered.find((p) => p.id === id))
      .filter(Boolean)

    setProducts(ordered as ProductItem[])
  }, [savedIds])

  // 🔥 remove handler
  const handleRemove = (id: string) => {
    const updated = savedIds.filter((itemId) => itemId !== id)

    setSavedIds(updated)
    localStorage.setItem("saved_products", JSON.stringify(updated))
  }

  // 🔥 EMPTY STATE
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">No saved products</h2>
        <p className="text-gray-500 mt-2">
          Start saving products to see them here
        </p>

        <Link
          href="/search"
          className="inline-block mt-4 bg-black text-white px-5 py-2 rounded-lg hover:opacity-90 transition"
        >
          Explore Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Saved Products</h1>

      {products.map((item, index) => (
        <div key={item.id} className="relative">

          {/* REMOVE BUTTON */}
          <button
            onClick={() => handleRemove(item.id)}
            className="absolute top-2 right-2 text-xs bg-black text-white px-2 py-1 rounded hover:opacity-80 transition"
          >
            Remove
          </button>

          <ResultCard item={item} index={index} />
        </div>
      ))}
    </div>
  )
}