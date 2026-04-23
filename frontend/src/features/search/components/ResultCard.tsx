import { ProductItem } from "@/types/search"

type Props = {
  item: ProductItem
  index?: number
  highlight?: boolean
}

export default function ResultCard({ item, highlight, index }: Props) {
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

  // 🔥 NEW: Highlight best spec
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

  return (
    <div
      className={`rounded-2xl p-5 bg-white transition border ${
        highlight
          ? "border-black shadow-xl scale-[1.02]"
          : "border-gray-200 hover:shadow-md"
      }`}
    >
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

          {/* 🔥 NEW: BEST FEATURE TAG */}
          {bestKey && (
            <span className="inline-block mt-1 text-[10px] bg-black text-white px-2 py-[2px] rounded-full">
              Best in {bestKey}
            </span>
          )}
        </div>

        {/* SCORE BADGE */}
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

      {/* LABEL */}
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

            // 🔥 NEW: highlight best bar
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

      {/* 🔥 CTA + CONFIDENCE */}
      <div className="mt-4 flex items-center justify-between">

        {item.confidence !== undefined && (
          <span className="text-xs text-gray-500">
            Confidence: {item.confidence}%
          </span>
        )}

        <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 active:scale-95 transition">
          Buy Now
        </button>
      </div>
    </div>
  )
}