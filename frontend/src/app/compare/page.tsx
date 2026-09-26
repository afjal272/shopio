"use client"

import Image, { type ImageLoaderProps } from "next/image"
import { useEffect, useMemo, useState } from "react"

import { API_BASE_URL } from "@/config/api"
import { ProductItem } from "@/types/search"

type ComparisonType = {
  winner: string
  reasons: string[]
  scores: { id: string; score: number }[]
  intent?: string[]
  weaknesses?: { id: string; points: string[] }[]
}

const DEFAULT_IMAGE = "https://via.placeholder.com/150"

const productImageLoader = ({ src }: ImageLoaderProps) => src

export default function ComparePage() {
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [comparison, setComparison] = useState<ComparisonType | null>(null)
  const [loading, setLoading] = useState(true)

  const getTags = (product: ProductItem, score?: number) => {
    const tags: string[] = []

    if ((product.specs?.processorScore || 0) >= 8) {
      tags.push("🔥 Gaming")
    }

    if ((product.specs?.battery || 0) >= 5500) {
      tags.push("🔋 Battery")
    }

    if ((product.rating || 0) >= 4.3) {
      tags.push("📸 Camera")
    }

    if ((score || 0) >= 8) {
      tags.push("💰 Value")
    }

    return tags.slice(0, 2)
  }

  const getScorePercent = (score: number) => {
    if (score > 100) return 100
    if (score < 0) return 0
    return score
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

      const res = await fetch(`${API_BASE_URL}/api/search/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      setProducts(
        Array.isArray(data.products) ? data.products : []
      )
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
    void loadProducts()

    const handleCompareUpdate = () => {
      void loadProducts()
    }

    window.addEventListener("compare_update", handleCompareUpdate)

    return () => {
      window.removeEventListener(
        "compare_update",
        handleCompareUpdate
      )
    }
  }, [])

  const scoreMap = useMemo(() => {
    return new Map(
      (comparison?.scores || []).map((score) => [
        String(score.id),
        Number(score.score || 0),
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
    products.find(
      (product) =>
        String(product.id) === String(comparison?.winner)
    ) || sorted[0]

  const intent = comparison?.intent || ["balanced"]

  const isImportant = (label: string) => {
    if (intent.includes("gaming") && label === "Processor") {
      return true
    }

    if (intent.includes("battery") && label === "Battery") {
      return true
    }

    if (intent.includes("camera") && label === "Score") {
      return true
    }

    return false
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-[#656b76]">
        Loading...
      </div>
    )
  }

  if (products.length < 2) {
    return (
      <div className="p-10 text-center text-[#656b76]">
        Select at least 2 products
      </div>
    )
  }

  const minPrice = Math.min(
    ...products.map((product) => Number(product.price || 0))
  )

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:space-y-12 md:p-10">
      {/* Winner Hero */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-gradient-to-r from-green-50 to-white p-4 shadow-md md:flex-row md:gap-6 md:p-6">
        <Image
          loader={productImageLoader}
          src={winner?.images?.[0] || DEFAULT_IMAGE}
          alt={winner?.name || "Recommended product"}
          width={160}
          height={160}
          className="h-32 w-32 rounded-xl bg-white object-contain p-3 md:h-40 md:w-40"
        />

        <div className="w-full flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-green-700">
            {winner?.name}
          </h2>

          <p className="mt-1 text-lg font-semibold text-green-600">
            ₹{winner?.price}
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Score:{" "}
            {Number(
              scoreMap.get(String(winner?.id)) || 0
            )}
          </p>

          {comparison?.reasons &&
            comparison.reasons.length > 0 && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-left">
                {comparison.reasons.map((reason, index) => (
                  <div key={index} className="text-sm">
                    ✔ {reason}
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {sorted.map((product) => {
          const score = Number(
            scoreMap.get(String(product.id)) || 0
          )

          const isWinner =
            product.id === winner?.id

          const isCheapest =
            Number(product.price) === minPrice

          return (
            <div
              key={product.id}
              className={`min-w-0 rounded-xl border bg-white p-3 shadow-md transition hover:shadow-lg md:rounded-2xl md:p-4 ${
                isWinner
                  ? "ring-2 ring-green-400"
                  : ""
              }`}
            >
              <div className="relative">
                <Image
                  loader={productImageLoader}
                  src={
                    product.images?.[0] ||
                    DEFAULT_IMAGE
                  }
                  alt={product.name || "Product image"}
                  width={320}
                  height={144}
                  className="h-28 w-full rounded-lg bg-gray-50 object-contain p-2 md:h-36"
                />

                {isWinner && (
                  <span className="absolute right-2 top-2 rounded bg-green-500 px-2 py-1 text-[10px] text-white md:text-xs">
                    Best
                  </span>
                )}

                {isCheapest && (
                  <span className="absolute left-2 top-2 rounded bg-blue-500 px-2 py-1 text-[10px] text-white md:text-xs">
                    Cheapest
                  </span>
                )}
              </div>

              <h3 className="mt-3 line-clamp-2 text-sm font-semibold md:text-base">
                {product.name}
              </h3>

              <div className="mt-2 flex flex-wrap gap-1">
                {getTags(product, score).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-gray-100 px-2 py-1 text-[10px] md:text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-2 text-lg font-bold">
                ₹{product.price}
              </p>

              {/* Score */}
              <div className="mt-2">
                <div className="h-2 overflow-hidden rounded bg-gray-200">
                  <div
                    className={`h-2 rounded ${
                      score > 80
                        ? "bg-green-500"
                        : score > 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${getScorePercent(score)}%`,
                    }}
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Score: {score}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <div className="min-w-[700px] text-sm">
          <div className="grid grid-cols-5 bg-gray-100 p-3 font-semibold">
            <div>Spec</div>

            {sorted.map((product) => (
              <div key={product.id}>
                {product.name}
              </div>
            ))}
          </div>

          {[
            {
              label: "Price",
              get: (product: ProductItem) =>
                `₹${product.price}`,
            },
            {
              label: "Score",
              get: (product: ProductItem) =>
                scoreMap.get(String(product.id)) || 0,
            },
            {
              label: "RAM",
              get: (product: ProductItem) =>
                `${product.specs?.ram ?? "-"} GB`,
            },
            {
              label: "Battery",
              get: (product: ProductItem) =>
                `${product.specs?.battery ?? "-"} mAh`,
            },
            {
              label: "Processor",
              get: (product: ProductItem) =>
                product.specs?.processorScore ?? "-",
            },
          ].map((row) => (
            <div
              key={row.label}
              className={`grid grid-cols-5 border-t p-3 ${
                isImportant(row.label)
                  ? "bg-yellow-50 font-semibold"
                  : ""
              }`}
            >
              <div>{row.label}</div>

              {sorted.map((product) => (
                <div key={product.id}>
                  {String(row.get(product) ?? "-")}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}