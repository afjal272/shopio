import { ProductItem } from "@/types/search"

type Props = {
  item: ProductItem
  index?: number
  highlight?: boolean
}

export default function ResultCard({ item, highlight, index }: Props) {
  const scoreColor =
    item.score > 85
      ? "bg-green-500"
      : item.score > 70
      ? "bg-yellow-500"
      : "bg-red-400"

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
          alt={item.title}
          className="w-16 h-16 object-cover rounded-xl border"
        />

        <div className="flex-1">
          <h3 className="font-semibold text-black text-base leading-tight">
            {index !== undefined && `#${index + 1} `}
            {item.title}
          </h3>

          <p className="text-sm text-gray-500 mt-1">₹{item.price}</p>
        </div>

        {/* 🔥 SCORE BADGE */}
        <div className="text-right">
          <div
            className={`text-sm font-semibold text-white px-3 py-1 rounded-full ${scoreColor}`}
          >
            {item.score}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">match</p>
        </div>
      </div>

      {/* 🔥 SCORE BAR */}
      <div className="w-full bg-gray-200 h-2 rounded mt-4 overflow-hidden">
        <div
          className={`${scoreColor} h-2 rounded`}
          style={{ width: `${item.score}%` }}
        />
      </div>

      {/* LABEL */}
      <p className="text-xs text-gray-500 mt-1">
        {item.score > 85
          ? "Perfect for your needs"
          : item.score > 70
          ? "Good match"
          : "May not be ideal"}
      </p>

      {/* CONFIDENCE */}
      {item.confidence !== undefined && (
        <p className="text-xs text-gray-400 mt-2">
          Confidence: {item.confidence}%
        </p>
      )}

      {/* 🔥 EXPLANATION */}
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

      {/* 🔥 BREAKDOWN (cleaner) */}
      {item.breakdown && (
        <div className="mt-4 space-y-2">
          {Object.entries(item.breakdown).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-[11px] text-gray-500">
                <span className="capitalize">{key}</span>
                <span>{value}%</span>
              </div>

              <div className="w-full bg-gray-200 h-1 rounded overflow-hidden">
                <div
                  className="bg-black/80 h-1 rounded"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}