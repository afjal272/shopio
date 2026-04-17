import ResultCard from "./ResultCard"

export default function Results({ data }: any) {
  const { best, top3, parsed, notRecommended, comparison } = data

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* 🔥 USER CONTEXT */}
      {parsed && (
        <div className="mb-6 text-sm text-gray-500 text-center">
          Showing results for{" "}
          <span className="text-black font-medium">
            {parsed.intent?.join(", ") || "general"}
          </span>{" "}
          {parsed.budget && (
            <>
              under <span className="font-medium">₹{parsed.budget}</span>
            </>
          )}
        </div>
      )}

      {/* ❌ NO RESULT */}
      {best?.score === 0 && (
        <p className="text-red-500 text-sm text-center mt-6">
          No suitable product found for your query
        </p>
      )}

      {/* ✅ BEST RESULT */}
      {best && best.score > 0 && (
        <div className="mt-8">
          <h2 className="text-green-600 font-semibold mb-3 text-lg">
            🏆 Best Choice
          </h2>

          <ResultCard item={best} highlight />
        </div>
      )}

      {/* 🔥 NEW: COMPARISON */}
      {comparison?.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">
            Why this is better?
          </h3>

          <ul className="text-sm text-gray-700 space-y-2">
            {comparison.map((point: string, i: number) => (
              <li key={i}>✔ {point}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ TOP 3 */}
      {top3?.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4 text-black">
            Top Recommendations
          </h3>

          <div className="flex flex-col gap-4">
            {top3.map((item: any, index: number) => (
              <ResultCard
                key={item.id + index}
                item={item}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* 🔥 WHY NOT THESE */}
      {notRecommended?.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-red-500 mb-4">
            Why not these?
          </h3>

          <div className="flex flex-col gap-2">
            {notRecommended.map((item: any, index: number) => (
              <div
                key={item.id + index}
                className="text-sm text-gray-600 border border-gray-200 rounded-lg p-3 bg-gray-50"
              >
                ❌ <span className="font-medium text-black">{item.title}</span> — {item.reason}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}