import ResultCard from "./ResultCard"

export default function Results({ data }: any) {
  const { best, top3 } = data

  return (
    <div className="w-full max-w-md">

      {/* ❌ NO RESULT */}
      {best?.score === 0 && (
        <p className="text-red-400 text-sm text-center mt-4">
          No suitable product found
        </p>
      )}

      {/* ✅ BEST RESULT */}
      {best && best.score > 0 && (
        <div className="mt-6">
          <h2 className="text-green-400 font-bold mb-2">
            🏆 Best Choice
          </h2>

          <ResultCard item={best} highlight />
        </div>
      )}

      {/* ✅ TOP 3 */}
      {top3?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">
            Top Recommendations
          </h3>

          <div className="flex flex-col gap-3">
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