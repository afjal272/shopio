import ResultCard from "./ResultCard"
import { SearchResponse } from "@/types/search"

export default function Results({ data }: { data: SearchResponse }) {

   console.log("RESULTS RECEIVED:", data)
   
  const { best, top3, parsed, notRecommended, comparison } = data

  return (
    <div className="w-full max-w-3xl mx-auto space-y-12">

      {/* 🔥 USER CONTEXT (IMPROVED) */}
      {parsed && (
        <div className="text-sm text-gray-500 text-center">
          Results for{" "}
          <span className="text-black font-medium">
            {parsed.intent?.join(" & ") || "general"}
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
          No suitable product found
        </p>
      )}

      {/* 🔥 BEST RESULT (UPGRADED) */}
      {best && best.score > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-gray-50 to-white border border-gray-200 shadow-md">
          
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-black font-semibold text-lg">
              🏆 Best Choice
            </h2>

            <span className="text-xs bg-black text-white px-3 py-1 rounded-full">
              Top Match
            </span>
          </div>

          <ResultCard item={best} highlight />
        </div>
      )}

      {/* 🔥 COMPARISON (MORE VISIBLE) */}
      {comparison?.length > 0 && (
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

      {/* 🔥 TOP 3 */}
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
              />
            ))}
          </div>
        </div>
      )}

      {/* 🔥 WHY NOT THESE (IMPROVED READABILITY) */}
      {notRecommended?.length > 0 && (
        <div className="p-5 border border-red-100 bg-red-50 rounded-2xl">
          <h3 className="text-red-600 font-semibold mb-4">
            Why not these?
          </h3>

          <div className="flex flex-col gap-3">
            {notRecommended.map((item) => (
              <div
                key={item.id}
                className="text-sm text-gray-700 border border-red-100 rounded-lg p-3 bg-white flex justify-between items-center"
              >
                <span>
                  ❌{" "}
                  <span className="font-medium text-black">
                    {item.title}
                  </span>{" "}
                  — {item.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}