"use client"

import { useEffect, useState } from "react"
import { ProductItem } from "@/types/search"

export default function ComparePage() {
  const [products, setProducts] = useState<ProductItem[]>([])

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("compare_ids") || "[]")
    const all = JSON.parse(localStorage.getItem("last_results") || "[]")

    const selected = all.filter((p: ProductItem) => ids.includes(p.id))
    setProducts(selected)
  }, [])

  if (products.length < 2) {
    return <div className="p-10">Select 2 products to compare</div>
  }

  const [a, b] = products

  return (
    <div className="p-10 grid grid-cols-2 gap-6">

      <div className="border p-4 rounded">
        <h2 className="font-bold">{a.title}</h2>
        <p>Price: ₹{a.price}</p>
        <p>Score: {a.score}</p>
      </div>

      <div className="border p-4 rounded">
        <h2 className="font-bold">{b.title}</h2>
        <p>Price: ₹{b.price}</p>
        <p>Score: {b.score}</p>
      </div>

    </div>
  )
}