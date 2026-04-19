import { ProductItem } from "@/types/search"

type Props = {
  item: ProductItem
  index?: number
  highlight?: boolean
}

export default function ResultCard({ item, highlight, index }: Props) {
  return (
    <div
      className={`border rounded-xl p-5 bg-white transition ${
        highlight
          ? "border-black shadow-lg"
          : "border-gray-200 hover:shadow-md"
      }`}
    >
      {/* IMAGE + TITLE */}
      <div className="flex gap-4 items-center">
        <img
          src={item.image || "/placeholder.png"} // 🔥 fallback added
          alt={item.title}
          className="w-16 h-16 object-cover rounded-lg border"
        />

        <div className="flex-1">
          <h3 className="font-semibold text-black">
            {index !== undefined && `#${index + 1} `}
            {item.title}
          </h3>

          <p className="text-sm text-gray-500">₹{item.price}</p>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold text-black">
            {item.score}/100
          </p>
          <p className="text-xs text-gray-400">score</p>
        </div>
      </div>

      {/* SCORE BAR */}
      <div className="w-full bg-gray-200 h-2 rounded mt-3">
        <div
          className="bg-black h-2 rounded"
          style={{ width: `${item.score}%` }}
        />
      </div>

      {/* SCORE LABEL */}
      <p className="text-xs text-gray-500 mt-1">
        {item.score > 85
          ? "Excellent match"
          : item.score > 70
          ? "Good choice"
          : "Average fit"}
      </p>

      {/* CONFIDENCE */}
      {item.confidence !== undefined && (
        <p className="text-xs text-gray-500 mt-2">
          Confidence: {item.confidence}%
        </p>
      )}

      {/* EXPLANATION */}
      {item.explanation && (
        <p className="text-sm text-gray-600 mt-3 leading-relaxed">
          {item.explanation}
        </p>
      )}

      {/* TAGS */}
      {item.tags?.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* BREAKDOWN */}
      {item.breakdown && (
        <div className="mt-4 space-y-2">
          {Object.entries(item.breakdown).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-gray-500">
                <span className="capitalize">{key}</span>
                <span>{value}%</span>
              </div>

              <div className="w-full bg-gray-200 h-1 rounded">
                <div
                  className="bg-black h-1 rounded"
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