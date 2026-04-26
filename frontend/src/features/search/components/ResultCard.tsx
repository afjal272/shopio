"use client"

import { ProductItem } from "@/types/search"
import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { toast } from "sonner"

type Props = {
  item: ProductItem
  index?: number
  highlight?: boolean

  // 🔥 ADD (compare support)
  selected?: boolean
  onSelect?: () => void
}

export default function ResultCard({ item, highlight, index, selected, onSelect }: Props) {
  const safeScore = Math.max(0, Math.min(100, item.score || 0))

  const scoreColor =
    safeScore > 85
      ? "bg-green-500"
      : safeScore > 70
      ? "bg-yellow-500"
      : "bg-red-400"

  const formattedPrice = item.price
    ? new Intl.NumberFormat("en-IN").format(item.price)
    : "N/A"

  // 🔥 SAVE STATE
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("saved_products") || "[]")
      setSaved(stored.includes(item.id))
    } catch {
      setSaved(false)
    }
  }, [item.id])

  const toggleSave = () => {
    let stored: string[] = []

    try {
      stored = JSON.parse(localStorage.getItem("saved_products") || "[]")
    } catch {
      stored = []
    }

    if (stored.includes(item.id)) {
      stored = stored.filter((id: string) => id !== item.id)
      setSaved(false)
      toast.success("Removed from wishlist")
    } else {
      stored.push(item.id)
      setSaved(true)
      toast.success("Saved to wishlist")
    }

    localStorage.setItem("saved_products", JSON.stringify(stored))
  }

  // 🔥 Highlight best spec
  let bestKey: string | null = null
  let bestValue = 0

  if (item.breakdown) {
    Object.entries(item.breakdown).forEach(([key, value]) => {
      const val = Number(value) || 0
      if (val > bestValue) {
        bestValue = val
        bestKey = key
      }
    })
  }

  // 🔥 VALUE SCORE
  const valueScore =
    ((item.breakdown?.processor || 0) +
      (item.breakdown?.ram || 0)) /
    (Math.max(item.price || 1, 1) / 1000)

  let valueLabel = "Balanced"

  if (valueScore > 12) valueLabel = "🔥 Great Value"
  else if (valueScore < 6) valueLabel = "Overpriced"

  return (
    <div
      className={`relative rounded-2xl p-5 bg-white transition border ${
        highlight
          ? "border-black shadow-xl scale-[1.02]"
          : "border-gray-200 hover:shadow-md"
      }`}
    >

      {/* 🔥 ADD: SELECT CHECKBOX */}
      {onSelect && (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation() // 🔥 prevent card click issues
            onSelect()
          }}
          className="absolute top-3 left-3 w-4 h-4 cursor-pointer"
        />
      )}

      {/* TOP */}
      <div className="flex gap-4 items-center">
        <img
          src={item.image || "/placeholder.png"}
          alt={item.title || "product"}
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = "/placeholder.png"
          }}
          className="w-16 h-16 object-cover rounded-xl border"
        />

        <div className="flex-1">
          <h3 className="font-semibold text-black text-base leading-tight">
            {index !== undefined && `#${index + 1} `}
            {item.title || "Untitled product"}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            ₹{formattedPrice}
          </p>

          <p className="text-xs mt-1 text-gray-600">
            {valueLabel}
          </p>

          {bestKey && (
            <span className="inline-block mt-1 text-[10px] bg-black text-white px-2 py-[2px] rounded-full">
              Best in {bestKey}
            </span>
          )}
        </div>

        {/* SCORE */}
        <div className="text-right">
          <div
            className={`text-sm font-semibold text-white px-3 py-1 rounded-full ${scoreColor}`}
          >
            {safeScore}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">match</p>
        </div>
      </div>

      {/* SCORE BAR */}
      <div className="w-full bg-gray-200 h-2 rounded mt-4 overflow-hidden">
        <div
          className={`${scoreColor} h-2 rounded`}
          style={{ width: `${safeScore}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-1">
        {safeScore > 85
          ? "Perfect for your needs"
          : safeScore > 70
          ? "Good match"
          : "May not be ideal"}
      </p>

      {/* EXPLANATION */}
      {item.explanation && (
        <p className="text-sm text-gray-700 mt-3 leading-relaxed">
          {item.explanation}
        </p>
      )}

      {/* TAGS */}
      {item.tags?.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-black/5 text-gray-700 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* BREAKDOWN */}
      {item.breakdown && (
        <div className="mt-4 space-y-2">
          {Object.entries(item.breakdown).map(([key, value]) => {
            const safeValue = Math.max(0, Math.min(100, Number(value) || 0))
            const isBest = key === bestKey

            return (
              <div key={key}>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span className={`capitalize ${isBest ? "font-semibold text-black" : ""}`}>
                    {key}
                  </span>
                  <span>{safeValue}%</span>
                </div>

                <div className="w-full bg-gray-200 h-1 rounded overflow-hidden">
                  <div
                    className={`${isBest ? "bg-black" : "bg-black/60"} h-1 rounded`}
                    style={{ width: `${safeValue}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-4 flex items-center justify-between">
        {item.confidence !== undefined && (
          <span className="text-xs text-gray-500">
            Confidence: {item.confidence}%
          </span>
        )}

        <div className="flex gap-2">
          <button
            onClick={toggleSave}
            title={saved ? "Remove from wishlist" : "Save to wishlist"}
            className={`p-2 rounded-lg transition ${
              saved
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Heart
              size={16}
              className={`transition ${
                saved ? "fill-white scale-110" : "hover:scale-110"
              }`}
            />
          </button>

          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 active:scale-95 transition">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}