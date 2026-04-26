"use client"

import ResultCard from "./ResultCard"
import { SearchResponse } from "@/types/search"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

// 🔥 UPDATED PROPS (ADD ONLY)
export default function Results({
  data,
  selected = [],
  onSelect,
}: {
  data: SearchResponse
  selected?: string[]
  onSelect?: (id: string) => void
}) {

  const router = useRouter()

  const { best, top3, parsed, notRecommended, comparison, isRelaxed } = data

  // 🔥 ADDED: SAVE LAST RESULTS (no delete, pure addition)
  useEffect(() => {
    if (best) {
      const all = [best, ...(top3 || [])]
      localStorage.setItem("last_results", JSON.stringify(all))
    }
  }, [best, top3])

  const noResults =
    (!best || best.score === 0) &&
    (!top3 || top3.length === 0) &&
    !isRelaxed

  const intentText =
    parsed?.intent?.length > 1
      ? parsed.intent.join(" & ")
      : parsed?.intent?.[0] || "general use"

  if (noResults) {
    return (
      <div className="w-full max-w-3xl mx-auto text-center py-12 space-y-4">
        <p className="text-lg font-semibold text-black">
          No exact match found
        </p>

        <p className="text-sm text-gray-500">
          Try increasing your budget or changing preferences
        </p>

        <div className="flex justify-center gap-2 flex-wrap">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm cursor-pointer">
            best phone under 30000
          </span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm cursor-pointer">
            best gaming phone
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-12">

      {isRelaxed && (
        <div className="text-center text-sm text-orange-600">
          Budget too low — showing closest available options
        </div>
      )}

      {parsed && (
        <div className="text-sm text-gray-500 text-center">
          Results for{" "}
          <span className="text-black font-medium">
            {intentText}
          </span>{" "}
          {parsed.budget && (
            <>
              under <span className="font-medium">₹{parsed.budget}</span>
            </>
          )}
        </div>
      )}

      {best && best.score > 0 && (
        <div className="p-4 rounded-2xl bg-black text-white text-center text-sm">
          Best for{" "}
          <span className="font-semibold">
            {intentText}
          </span>{" "}
          {parsed?.budget && <>under ₹{parsed.budget}</>} with strong overall performance
        </div>
      )}

      {best && best.score <= 40 && (
        <div className="text-center text-sm text-orange-500">
          Not an ideal match, but best available in this range
        </div>
      )}

      {best && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-gray-50 to-white border border-black shadow-lg space-y-4">

          <div className="flex items-center justify-between">
            <h2 className="text-black font-bold text-xl">
              🏆 Best Choice
            </h2>

            <div className="text-right">
              <div className="text-xs bg-black text-white px-3 py-1 rounded-full">
                {best.score} match
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Confidence {best.confidence}%
              </p>
            </div>
          </div>

          {best.breakdown && (
            <div className="text-xs text-gray-600 bg-black/5 px-3 py-2 rounded-lg">
              Strongest area:{" "}
              <span className="font-medium text-black">
                {Object.entries(best.breakdown)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]}
              </span>
            </div>
          )}

          {best.breakdown && (
            <div className="text-xs text-gray-500 text-center">
              Balanced score across specs improves overall ranking
            </div>
          )}

          {comparison?.length > 0 && (
            <div className="p-5 border border-green-200 bg-green-50 rounded-2xl">
              <h3 className="text-green-700 font-semibold mb-3">
                Why this beats next option
              </h3>

              <div className="space-y-2">
                {comparison.map((point, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-white border border-green-100 rounded-lg px-3 py-2 text-sm text-gray-700"
                  >
                    <span className="text-green-600 font-bold">✔</span>
                    <span className="leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🔥 ADD selection support */}
          <ResultCard
            item={best}
            highlight
            selected={selected?.includes(best.id)}
            onSelect={onSelect ? () => onSelect(best.id) : undefined}
          />
        </div>
      )}

      {comparison?.length > 0 && best && best.score < 60 && (
        <div className="p-5 border border-black/10 bg-black/5 rounded-2xl">
          <h3 className="text-black font-semibold mb-3">
            Why this wins
          </h3>

          <ul className="text-sm text-gray-700 space-y-2">
            {comparison.map((point, i) => (
              <li key={i} className="flex gap-2">
                <span>✔</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {top3?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black">
            Other good options
          </h3>

          <div className="flex flex-col gap-4">
            {top3.map((item, index) => (
              <ResultCard
                key={item.id}
                item={item}
                index={index}
                selected={selected?.includes(item.id)}              // 🔥 ADD
                onSelect={onSelect ? () => onSelect(item.id) : undefined} // 🔥 ADD
              />
            ))}
          </div>
        </div>
      )}

      {notRecommended?.length > 0 && (
        <div className="p-5 border border-red-100 bg-red-50 rounded-2xl">
          <h3 className="text-red-600 font-semibold mb-4">
            Why not these?
          </h3>

          <div className="flex flex-col gap-3">
            {notRecommended.map((item) => (
              <div
                key={item.id}
                className="text-sm text-gray-700 border border-red-100 rounded-lg p-3 bg-white hover:bg-red-50 transition flex justify-between items-start"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-black">
                    ❌ {item.title}
                  </span>

                  <span className="text-red-600 text-xs mt-1">
                    {item.reason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.suggestions?.length > 0 && (
        <div className="p-5 border border-blue-100 bg-blue-50 rounded-2xl">
          <h3 className="text-blue-600 font-semibold mb-3">
            Try refining your search
          </h3>

          <div className="flex flex-wrap gap-2">
            {data.suggestions.map((s, i) => (
              <span
                key={i}
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(s)}`)
                }}
                className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm cursor-pointer hover:bg-blue-100 transition"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}