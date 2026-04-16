import ResultCard from "./ResultCard"

export default function Results({ data }: any) {
  const { best, top3, parsed } = data

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

      {/* ✅ TOP 3 */}
      {top3?.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4 text-black">
            Top Recommendations
          </h3>

          <div className="flex flex-col gap-4">
            {top3.map((item: any, index: number) => (
              <ResultCard
                key={item.id}
                item={item}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}