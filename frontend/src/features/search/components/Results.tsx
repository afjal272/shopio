"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import ResultCard from "./ResultCard";

import {
  SearchResponse,
  SuggestionItem,
  ProductItem,
} from "@/types/search";

interface ResultsProps {
  data: SearchResponse;
  selected?: string[];
  onSelect?: (id: string) => void;
}

type MetricKey =
  | "ram"
  | "processor"
  | "battery"
  | "rating";

const METRIC_LABELS: Record<MetricKey, string> = {
  ram: "RAM",
  processor: "Processor",
  battery: "Battery",
  rating: "Rating",
};

const INTENT_PRIORITY: Record<
  string,
  MetricKey[]
> = {
  gaming: ["processor", "ram", "battery", "rating"],
  camera: ["rating", "battery", "processor", "ram"],
  battery: ["battery", "rating", "ram", "processor"],
  balanced: ["processor", "ram", "battery", "rating"],
};

export default function Results({
  data,
  selected = [],
  onSelect,
}: ResultsProps) {
  const router = useRouter();

  const best = data?.best ?? null;

  const recommendations = Array.isArray(
    data?.recommendations
  )
    ? data.recommendations
    : [];

  const parsed = data?.parsed ?? {
    intent: [],
    budget: undefined,
  };

  const comparison = Array.isArray(data?.comparison)
    ? data.comparison
    : [];

  const notRecommended = Array.isArray(
    data?.notRecommended
  )
    ? data.notRecommended
    : [];

  const suggestions = Array.isArray(
    data?.suggestions
  )
    ? data.suggestions
    : [];

  const isRelaxed = Boolean(data?.isRelaxed);

  useEffect(() => {
    if (!best) return;

    try {
      localStorage.setItem(
        "last_results",
        JSON.stringify([
          best,
          ...recommendations,
        ])
      );
    } catch (error) {
      console.error(
        "Failed to persist search results:",
        error
      );
    }
  }, [best, recommendations]);

  const allProducts = useMemo(() => {
    const products: ProductItem[] = [];

    if (best) {
      products.push(best);
    }

    for (const product of recommendations) {
      if (
        !products.some(
          (item) => String(item.id) === String(product.id)
        )
      ) {
        products.push(product);
      }
    }

    return products;
  }, [best, recommendations]);

  const bestMetrics = useMemo(() => {
    const result: Partial<
      Record<MetricKey, string>
    > = {};

    if (allProducts.length < 2) {
      return result;
    }

    const intents = Array.isArray(parsed?.intent)
      ? parsed.intent.filter(
          (value): value is string =>
            typeof value === "string" &&
            value.trim().length > 0
        )
      : [];

    const priority = getMetricPriority(intents);

    for (const metric of priority) {
      const winner = findMetricWinner(
        allProducts,
        metric
      );

      if (!winner) continue;

      result[metric] = String(winner.id);
    }

    return result;
  }, [allProducts, parsed?.intent]);

  const strongestArea = useMemo(() => {
    if (!best) return null;

    const intents = Array.isArray(parsed?.intent)
      ? parsed.intent.filter(
          (value): value is string =>
            typeof value === "string" &&
            value.trim().length > 0
        )
      : [];

    const priority = getMetricPriority(intents);

    for (const metric of priority) {
      if (
        bestMetrics[metric] ===
        String(best.id)
      ) {
        return METRIC_LABELS[metric];
      }
    }

    return null;
  }, [
    best,
    bestMetrics,
    parsed?.intent,
  ]);

  const hasRecommendations =
    recommendations.length > 0;

  const noResults =
    !best &&
    !hasRecommendations &&
    !isRelaxed;

  const intents = Array.isArray(parsed?.intent)
    ? parsed.intent.filter(
        (value): value is string =>
          typeof value === "string" &&
          value.trim().length > 0
      )
    : [];

  const intentText =
    intents.length > 1
      ? intents.join(" & ")
      : intents[0] ?? "general";

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

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10">
      {isRelaxed && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 text-sm text-orange-700">
          Budget was too restrictive.
          Showing closest matching products.
        </div>
      )}

      <div className="text-center text-gray-500 text-sm">
        Results for

        <span className="font-semibold text-black mx-1">
          {intentText}
        </span>

        {parsed.budget && (
          <>
            under

            <span className="font-semibold text-black ml-1">
              ₹{parsed.budget.toLocaleString("en-IN")}
            </span>
          </>
        )}
      </div>

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

          {strongestArea && (
            <div className="rounded-xl bg-gray-50 border p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                Strongest Area
              </div>

              <div className="font-semibold">
                Best in {strongestArea}
              </div>
            </div>
          )}

          {comparison.length > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <h3 className="font-semibold text-green-700 mb-3">
                Why this wins
              </h3>

              <div className="space-y-2">
                {comparison.map(
                  (reason, index) => (
                    <div
                      key={`${index}-${reason}`}
                      className="rounded-lg bg-white border border-green-100 p-3 text-sm"
                    >
                      ✅ {reason}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <ResultCard
            item={best}
            highlight
            selected={selected.includes(
              String(best.id)
            )}
            onSelect={
              onSelect
                ? () => onSelect(String(best.id))
                : undefined
            }
          />
        </section>
      )}

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
                  selected={selected.includes(
                    String(item.id)
                  )}
                  onSelect={
                    onSelect
                      ? () =>
                          onSelect(
                            String(item.id)
                          )
                      : undefined
                  }
                />
              )
            )}
          </div>
        </section>
      )}

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

      {suggestions.length > 0 && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">
            Refine your search
          </h3>

          <div className="flex flex-wrap gap-3">
            {suggestions.map(
              (
                suggestion: SuggestionItem
              ) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => {
                    if (!suggestion.action) {
                      return;
                    }

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
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function getMetricPriority(
  intents: string[]
): MetricKey[] {
  for (const intent of intents) {
    const priority = INTENT_PRIORITY[
      intent.toLowerCase()
    ];

    if (priority) {
      return priority;
    }
  }

  return INTENT_PRIORITY.balanced;
}

function findMetricWinner(
  products: ProductItem[],
  metric: MetricKey
): ProductItem | null {
  const candidates = products.filter(
    (product) => {
      const value = getMetricValue(
        product,
        metric
      );

      return (
        value !== null &&
        value > 0
      );
    }
  );

  if (candidates.length < 2) {
    return null;
  }

  return [...candidates].sort(
    (a, b) => {
      const aValue =
        getMetricValue(a, metric) ?? 0;

      const bValue =
        getMetricValue(b, metric) ?? 0;

      if (bValue !== aValue) {
        return bValue - aValue;
      }

      return (
        (b.score ?? 0) -
        (a.score ?? 0)
      );
    }
  )[0] ?? null;
}

function getMetricValue(
  product: ProductItem,
  metric: MetricKey
): number | null {
  const value =
    product.breakdown?.[metric];

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return null;
  }

  return value;
}