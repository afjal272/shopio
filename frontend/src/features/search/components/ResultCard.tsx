type Props = {
  item: any
  index?: number
  highlight?: boolean
}

export default function ResultCard({ item, highlight, index }: any) {
  return (
    <div
      className={`border rounded-xl p-5 bg-white shadow-sm transition ${
        highlight ? "border-black shadow-md" : "border-gray-200"
      }`}
    >
      {/* Title + Rank */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-black">
          {index !== undefined && `#${index + 1} `}
          {item.title}
        </h3>

        <span className="text-sm text-gray-500">
          {item.score}/100
        </span>
      </div>

      {/* Score bar */}
      <div className="w-full bg-gray-200 h-2 rounded mt-2">
        <div
          className="bg-black h-2 rounded"
          style={{ width: `${item.score}%` }}
        />
      </div>

      {/* 🔥 Confidence */}
      {item.confidence !== undefined && (
        <p className="text-xs text-gray-500 mt-2">
          Confidence: {item.confidence}%
        </p>
      )}

      {/* 🔥 Explanation */}
      {item.explanation && (
        <p className="text-sm text-gray-600 mt-3">
          {item.explanation}
        </p>
      )}

      {/* 🔥 NEW: Breakdown */}
      {item.breakdown && (
        <div className="mt-4 space-y-2">
          {Object.entries(item.breakdown).map(([key, value]: any) => (
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