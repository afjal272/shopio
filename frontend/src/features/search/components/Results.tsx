import ResultCard from "./ResultCard"

export default function Results({ data }: any) {
  const { best, top3, parsed, notRecommended, comparison } = data

  return (
    <div className="w-full max-w-3xl mx-auto space-y-12">

      {/* 🔥 USER CONTEXT */}
      {parsed && (
        <div className="text-sm text-gray-500 text-center">
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
        <p className="text-red-500 text-sm text-center">
          No suitable product found for your query
        </p>
      )}

      {/* ✅ BEST RESULT (HERO CARD) */}
      {best && best.score > 0 && (
        <div className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
          <h2 className="text-green-600 font-semibold mb-4 text-xl">
            🏆 Best Choice
          </h2>

          <ResultCard item={best} highlight />
        </div>
      )}

      {/* 🔥 COMPARISON (CARD STYLE) */}
      {comparison?.length > 0 && (
        <div className="p-5 border border-blue-100 bg-blue-50 rounded-2xl">
          <h3 className="text-blue-700 font-semibold mb-3">
            Why this is better?
          </h3>

          <ul className="text-sm text-gray-700 space-y-1">
            {comparison.map((point: string, i: number) => (
              <li key={i}>✔ {point}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ TOP 3 */}
      {top3?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black">
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

      {/* 🔥 WHY NOT THESE (CARD STYLE) */}
      {notRecommended?.length > 0 && (
        <div className="p-5 border border-red-100 bg-red-50 rounded-2xl">
          <h3 className="text-red-600 font-semibold mb-4">
            Why not these?
          </h3>

          <div className="flex flex-col gap-3">
            {notRecommended.map((item: any, index: number) => (
              <div
                key={item.id + index}
                className="text-sm text-gray-700 border border-red-100 rounded-lg p-3 bg-white"
              >
                ❌{" "}
                <span className="font-medium text-black">
                  {item.title}
                </span>{" "}
                — {item.reason}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}