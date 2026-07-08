"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import ResultCard from "./ResultCard";

import {
  SearchResponse,
  SuggestionItem,
} from "@/types/search";

// ======================================================
// Props
// ======================================================

interface ResultsProps {
  data: SearchResponse;

  selected?: string[];

  onSelect?: (id: string) => void;
}

// ======================================================
// Component
// ======================================================

export default function Results({

  data,

  selected = [],

  onSelect,

}: ResultsProps) {

  const router = useRouter();

  const {

    best,

    recommendations,

    parsed,

    comparison,

    notRecommended,

    suggestions,

    isRelaxed,

  } = data;

  // ====================================================
  // Persist Results
  // ====================================================

  useEffect(() => {

    if (!best) return;

    localStorage.setItem(

      "last_results",

      JSON.stringify([

        best,

        ...recommendations,

      ])

    );

  }, [

    best,

    recommendations,

  ]);

  // ====================================================
  // Derived Values
  // ====================================================

  const hasRecommendations =
    recommendations.length > 0;

  const noResults =
    !best &&
    !hasRecommendations &&
    !isRelaxed;

  const intentText =
    parsed.intent.length > 1
      ? parsed.intent.join(" & ")
      : parsed.intent[0] ?? "general";

  // ====================================================
  // Empty State
  // ====================================================

  if (noResults) {

    return (

      <div className="w-full max-w-3xl mx-auto py-16 text-center space-y-5">

        <h2 className="text-2xl font-bold">

          No matching products found

        </h2>

        <p className="text-gray-500">

          Try increasing your budget or changing
          your search preferences.

        </p>

      </div>

    );

  }

  // ====================================================
  // UI
  // ====================================================

  return (

    <div className="w-full max-w-3xl mx-auto space-y-10">

      {/* Relaxed Search */}

      {isRelaxed && (

        <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 text-sm text-orange-700">

          Budget was too restrictive.
          Showing closest matching products.

        </div>

      )}

      {/* Search Context */}

      <div className="text-center text-gray-500 text-sm">

        Results for

        <span className="font-semibold text-black mx-1">

          {intentText}

        </span>

        {parsed.budget && (

          <>

            under

            <span className="font-semibold text-black ml-1">

              ₹{parsed.budget}

            </span>

          </>

        )}

      </div>

      {/* ================================================= */}
      {/* Best Product */}
      {/* ================================================= */}

      {best && (

        <section className="rounded-3xl border border-black bg-white shadow-lg p-6 space-y-5">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-bold">

                🏆 Best Choice

              </h2>

              <p className="text-sm text-gray-500">

                Highest ranked recommendation

              </p>

            </div>

            <div className="text-right">

              <div className="rounded-full bg-black text-white px-4 py-2 text-sm font-semibold">

                {best.score}% Match

              </div>

              <p className="mt-2 text-xs text-gray-500">

                Confidence {best.confidence}%

              </p>

            </div>

          </div>

          {best.breakdown && (

            <div className="rounded-xl bg-gray-50 border p-4">

              <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">

                Strongest Area

              </div>

              <div className="font-semibold">

                {

                  Object.entries(best.breakdown)

                    .sort(

                      (a, b) =>

                        Number(b[1]) -

                        Number(a[1])

                    )[0][0]

                }

              </div>

            </div>

          )}

          {comparison.length > 0 && (

            <div className="rounded-xl border border-green-200 bg-green-50 p-5">

              <h3 className="font-semibold text-green-700 mb-3">

                Why this wins

              </h3>

              <div className="space-y-2">

                {comparison.map((reason, index) => (

                  <div

                    key={index}

                    className="rounded-lg bg-white border border-green-100 p-3 text-sm"

                  >

                    ✅ {reason}

                  </div>

                ))}

              </div>

            </div>

          )}

          <ResultCard

            item={best}

            highlight

            selected={selected.includes(best.id)}

            onSelect={

              onSelect

                ? () => onSelect(best.id)

                : undefined

            }

          />

        </section>

      )}

      {/* ================================================= */}
      {/* Recommendations */}
      {/* ================================================= */}

      {recommendations.length > 0 && (

        <section className="space-y-5">

          <h3 className="text-xl font-bold">

            Other Good Options

          </h3>

          <div className="space-y-4">

            {recommendations.map(

              (item, index) => (

                <ResultCard

                  key={item.id}

                  item={item}

                  index={index}

                  selected={selected.includes(item.id)}

                  onSelect={

                    onSelect

                      ? () => onSelect(item.id)

                      : undefined

                  }

                />

              )

            )}

          </div>

        </section>

      )}

            {/* ================================================= */}
      {/* Not Recommended */}
      {/* ================================================= */}

      {notRecommended.length > 0 && (

        <section className="rounded-2xl border border-red-200 bg-red-50 p-5">

          <h3 className="text-lg font-semibold text-red-700 mb-4">

            Why not these?

          </h3>

          <div className="space-y-3">

            {notRecommended.map((item) => (

              <div
                key={item.id}
                className="rounded-xl border border-red-100 bg-white p-4"
              >

                <div className="font-medium text-black">

                  {item.name}

                </div>

                <div className="mt-1 text-sm text-red-600">

                  {item.reason}

                </div>

              </div>

            ))}

          </div>

        </section>

      )}

      {/* ================================================= */}
      {/* Suggestions */}
      {/* ================================================= */}

      {suggestions.length > 0 && (

        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

          <h3 className="text-lg font-semibold text-blue-700 mb-4">

            Refine your search

          </h3>

          <div className="flex flex-wrap gap-3">

            {suggestions.map((suggestion: SuggestionItem) => (

              <button

                key={suggestion.id}

                type="button"

                onClick={() => {

                  if (!suggestion.action) return;

                  router.push(

                    `/search?q=${encodeURIComponent(
                      suggestion.action
                    )}`

                  );

                }}

                className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm transition hover:bg-blue-100"

              >

                {suggestion.title}

              </button>

            ))}

          </div>

        </section>

      )}

    </div>

  );

}