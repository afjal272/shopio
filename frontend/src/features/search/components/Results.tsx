"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import ResultCard from "./ResultCard";

import {
  SearchResponse,
  SuggestionItem,
  ProductItem,
} from "@/types/search";

// ======================================================
// Types
// ======================================================

interface ResultsProps {
  data: SearchResponse;
  selected?: string[];
  onSelect?: (id: string) => void;
}

type MetricKey =
  | "ram"
  | "processor"
  | "battery"
  | "camera"
  | "rating";

type MetricValue = number | null;

// ======================================================
// Constants
// ======================================================

const EMPTY_PRODUCTS: ProductItem[] = [];

const EMPTY_STRINGS: string[] = [];

const EMPTY_NOT_RECOMMENDED: SearchResponse["notRecommended"] =
  [];

const EMPTY_SUGGESTIONS: SuggestionItem[] = [];

const EMPTY_PARSED: SearchResponse["parsed"] = {
  intent: [],
  budget: null,
};

const METRIC_LABELS: Record<
  MetricKey,
  string
> = {
  ram: "RAM",
  processor: "Processor",
  battery: "Battery",
  camera: "Camera",
  rating: "Rating",
};

const INTENT_PRIORITY: Record<
  string,
  MetricKey[]
> = {
  gaming: [
    "processor",
    "ram",
    "battery",
    "rating",
    "camera",
  ],

  camera: [
    "camera",
    "rating",
    "processor",
    "battery",
    "ram",
  ],

  battery: [
    "battery",
    "rating",
    "ram",
    "processor",
    "camera",
  ],

  balanced: [
    "processor",
    "ram",
    "battery",
    "camera",
    "rating",
  ],
};

// ======================================================
// Helpers
// ======================================================

function normalizeId(
  value: unknown,
): string {
  return String(
    value ?? "",
  );
}

function normalizeIntentList(
  value: unknown,
): string[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .filter(
      (
        item,
      ): item is string =>
        typeof item ===
        "string",
    )
    .map(
      (item) =>
        item
          .trim()
          .toLowerCase(),
    )
    .filter(Boolean);
}

function getSafeBudget(
  value: unknown,
): number | null {
  const budget =
    Number(value);

  return Number.isFinite(
    budget,
  ) && budget > 0
    ? budget
    : null;
}

function formatBudget(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-IN",
  ).format(value);
}

function safeNumericValue(
  value: unknown,
): number {
  const numeric =
    Number(value);

  return Number.isFinite(
    numeric,
  )
    ? numeric
    : 0;
}

function safeScore(
  value: unknown,
): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        safeNumericValue(
          value,
        ),
      ),
    ),
  );
}

function isPositiveFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    ) &&
    value > 0
  );
}

function capitalize(
  value: string,
): string {
  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

// ======================================================
// Metric Priority
// ======================================================

function getMetricPriority(
  intents: string[],
): MetricKey[] {
  for (
    const intent of intents
  ) {
    const normalized =
      intent
        .trim()
        .toLowerCase();

    const priority =
      INTENT_PRIORITY[
        normalized
      ];

    if (priority) {
      return priority;
    }
  }

  return INTENT_PRIORITY.balanced;
}

// ======================================================
// Metric Value
// ======================================================

function getMetricValue(
  product: ProductItem,
  metric: MetricKey,
): MetricValue {
  switch (metric) {
    case "ram": {
      const value =
        product.specs?.ram;

      return isPositiveFiniteNumber(
        value,
      )
        ? value
        : null;
    }

    case "battery": {
      const value =
        product.specs?.battery;

      return isPositiveFiniteNumber(
        value,
      )
        ? value
        : null;
    }

    case "camera": {
      const value =
        product.specs?.cameraMp;

      return isPositiveFiniteNumber(
        value,
      )
        ? value
        : null;
    }

    case "rating": {
      const value =
        product.rating;

      return isPositiveFiniteNumber(
        value,
      )
        ? value
        : null;
    }

    case "processor": {
      /*
       * Processor performance is intentionally compared using
       * the decision-engine normalized processor signal.
       *
       * Raw processor strings cannot be meaningfully sorted
       * lexicographically.
       */
      const value =
        product.breakdown
          ?.processor;

      return isPositiveFiniteNumber(
        value,
      )
        ? value
        : null;
    }

    default:
      return null;
  }
}

// ======================================================
// Metric Winner
// ======================================================

function findMetricWinner(
  products: ProductItem[],
  metric: MetricKey,
): ProductItem | null {
  const candidates =
    products.filter(
      (product) => {
        const value =
          getMetricValue(
            product,
            metric,
          );

        return (
          value !== null &&
          value > 0
        );
      },
    );

  /*
   * One product cannot meaningfully be called the winner
   * of a comparison when there is nothing to compare it with.
   */
  if (
    candidates.length < 2
  ) {
    return null;
  }

  return (
    [...candidates].sort(
      (a, b) => {
        const aValue =
          getMetricValue(
            a,
            metric,
          ) ?? 0;

        const bValue =
          getMetricValue(
            b,
            metric,
          ) ?? 0;

        if (
          bValue !==
          aValue
        ) {
          return (
            bValue -
            aValue
          );
        }

        /*
         * Deterministic tie-break:
         * higher overall recommendation score wins.
         */
        return (
          safeNumericValue(
            b.score,
          ) -
          safeNumericValue(
            a.score,
          )
        );
      },
    )[0] ?? null
  );
}

// ======================================================
// Component
// ======================================================

export default function Results({
  data,
  selected = [],
  onSelect,
}: ResultsProps) {
  const router =
    useRouter();

  // ====================================================
  // Defensive Data Normalization
  // ====================================================

  const best =
    data?.best ?? null;

  const recommendations =
    Array.isArray(
      data?.recommendations,
    )
      ? data.recommendations
      : EMPTY_PRODUCTS;

  const parsed =
    data?.parsed ??
    EMPTY_PARSED;

  const comparison =
    Array.isArray(
      data?.comparison,
    )
      ? data.comparison
      : EMPTY_STRINGS;

  const notRecommended =
    Array.isArray(
      data?.notRecommended,
    )
      ? data.notRecommended
      : EMPTY_NOT_RECOMMENDED;

  const suggestions =
    Array.isArray(
      data?.suggestions,
    )
      ? data.suggestions
      : EMPTY_SUGGESTIONS;

  const isRelaxed =
    Boolean(
      data?.isRelaxed,
    );

  const budget =
    getSafeBudget(
      parsed.budget,
    );

  const intents =
    normalizeIntentList(
      parsed.intent,
    );

  // ====================================================
  // Persist Last Results
  // ====================================================

  useEffect(() => {
    if (!best) {
      return;
    }

    try {
      localStorage.setItem(
        "last_results",
        JSON.stringify([
          best,
          ...recommendations,
        ]),
      );
    } catch (
      error
    ) {
      console.error(
        "Failed to persist search results:",
        error,
      );
    }
  }, [
    best,
    recommendations,
  ]);

  // ====================================================
  // Unique Product Collection
  // ====================================================

  /*
   * This calculation is intentionally kept simple.
   * The result set is small and typically contains only a
   * handful of products, so memoization adds complexity
   * without meaningful performance benefit.
   */
  const allProducts =
    buildUniqueProducts(
      best,
      recommendations,
    );

  // ====================================================
  // Metric Priority
  // ====================================================

  const metricPriority =
    getMetricPriority(
      intents,
    );

  // ====================================================
  // Best Product Per Metric
  // ====================================================

  const bestMetrics =
    buildBestMetrics(
      allProducts,
      metricPriority,
    );

  // ====================================================
  // Strongest Area
  // ====================================================

  const strongestArea =
    getStrongestArea(
      best,
      bestMetrics,
      metricPriority,
    );

  // ====================================================
  // Result State
  // ====================================================

  const hasRecommendations =
    recommendations.length > 0;

  const noResults =
    !best &&
    !hasRecommendations &&
    !isRelaxed;

  const intentText =
    intents.length > 1
      ? intents
          .map(
            capitalize,
          )
          .join(" & ")
      : capitalize(
          intents[0] ??
            "general",
        );

  // ====================================================
  // Empty State
  // ====================================================

  if (noResults) {
    return (
      <div
        className="
          w-full
          max-w-3xl
          mx-auto
          py-16
          text-center
          space-y-5
        "
      >
        <h2
          className="
            text-2xl
            font-bold
            text-black
          "
        >
          No matching
          products found
        </h2>

        <p
          className="
            text-gray-500
            text-sm
          "
        >
          Try increasing your
          budget or changing
          your search
          preferences.
        </p>
      </div>
    );
  }

  // ====================================================
  // Render
  // ====================================================

  return (
    <div
      className="
        w-full
        max-w-3xl
        mx-auto
        space-y-10
      "
    >
      {/* =================================================
          Relaxed Search Notice
      ================================================= */}

      {isRelaxed && (
        <div
          className="
            rounded-xl
            bg-orange-50
            border
            border-orange-200
            p-4
            text-sm
            text-orange-700
          "
          role="status"
        >
          <p className="font-medium">
            Budget was too
            restrictive.
          </p>

          <p className="mt-1">
            Showing the closest
            matching products.
          </p>
        </div>
      )}

      {/* =================================================
          Result Context
      ================================================= */}

      <div
        className="
          text-center
          text-gray-500
          text-sm
        "
      >
        Results for{" "}

        <span
          className="
            font-semibold
            text-black
            mx-1
          "
        >
          {intentText}
        </span>

        {budget !== null && (
          <>
            under{" "}

            <span
              className="
                font-semibold
                text-black
                ml-1
              "
            >
              ₹
              {formatBudget(
                budget,
              )}
            </span>
          </>
        )}
      </div>

      {/* =================================================
          Best Choice
      ================================================= */}

      {best && (
        <section
          className="
            rounded-3xl
            border
            border-black
            bg-white
            shadow-lg
            p-6
            space-y-5
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >
            <div>
              <h2
                className="
                  text-2xl
                  font-bold
                  text-black
                "
              >
                🏆 Best Choice
              </h2>

              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Highest ranked
                recommendation
              </p>
            </div>

            <div
              className="
                text-right
                shrink-0
              "
            >
              <div
                className="
                  rounded-full
                  bg-black
                  text-white
                  px-4
                  py-2
                  text-sm
                  font-semibold
                "
              >
                {safeScore(
                  best.score,
                )}
                % Match
              </div>

              {best.confidence !==
                undefined && (
                <p
                  className="
                    mt-2
                    text-xs
                    text-gray-500
                  "
                >
                  Confidence{" "}
                  {safeScore(
                    best.confidence,
                  )}
                  %
                </p>
              )}
            </div>
          </div>

          {/* =================================================
              Strongest Area
          ================================================= */}

          {strongestArea && (
            <div
              className="
                rounded-xl
                bg-gray-50
                border
                border-gray-100
                p-4
              "
            >
              <div
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-gray-500
                  mb-2
                "
              >
                Strongest Area
              </div>

              <div
                className="
                  font-semibold
                  text-black
                "
              >
                Best in{" "}
                {strongestArea}
              </div>
            </div>
          )}

          {/* =================================================
              Why This Wins
          ================================================= */}

          {comparison.length >
            0 && (
            <div
              className="
                rounded-xl
                border
                border-green-200
                bg-green-50
                p-5
              "
            >
              <h3
                className="
                  font-semibold
                  text-green-700
                  mb-3
                "
              >
                Why this wins
              </h3>

              <div
                className="
                  space-y-2
                "
              >
                {comparison.map(
                  (
                    reason,
                    index,
                  ) => (
                    <div
                      key={`${index}-${reason}`}
                      className="
                        rounded-lg
                        bg-white
                        border
                        border-green-100
                        p-3
                        text-sm
                        text-gray-800
                      "
                    >
                      <span
                        aria-hidden="true"
                      >
                        ✅
                      </span>{" "}
                      {reason}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* =================================================
              Best Product
          ================================================= */}

          <ResultCard
            item={best}
            highlight
            selected={selected.includes(
              normalizeId(
                best.id,
              ),
            )}
            onSelect={
              onSelect
                ? () =>
                    onSelect(
                      normalizeId(
                        best.id,
                      ),
                    )
                : undefined
            }
          />
        </section>
      )}

      {/* =================================================
          Recommendations
      ================================================= */}

      {hasRecommendations && (
        <section
          className="
            space-y-5
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >
            <div>
              <h3
                className="
                  text-xl
                  font-bold
                  text-black
                "
              >
                Other Good
                Options
              </h3>

              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Strong alternatives
                to the top
                recommendation.
              </p>
            </div>

            <span
              className="
                text-xs
                text-gray-500
                shrink-0
              "
            >
              {recommendations.length}{" "}
              option
              {recommendations.length ===
              1
                ? ""
                : "s"}
            </span>
          </div>

          <div
            className="
              space-y-4
            "
          >
            {recommendations.map(
              (
                product,
                index,
              ) => (
                <ResultCard
                  key={normalizeId(
                    product.id,
                  )}
                  item={product}
                  index={index}
                  selected={selected.includes(
                    normalizeId(
                      product.id,
                    ),
                  )}
                  onSelect={
                    onSelect
                      ? () =>
                          onSelect(
                            normalizeId(
                              product.id,
                            ),
                          )
                      : undefined
                  }
                />
              ),
            )}
          </div>
        </section>
      )}

      {/* =================================================
          Not Recommended
      ================================================= */}

      {notRecommended.length >
        0 && (
        <section
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-5
          "
        >
          <h3
            className="
              text-lg
              font-semibold
              text-red-700
              mb-4
            "
          >
            Why not these?
          </h3>

          <div
            className="
              space-y-3
            "
          >
            {notRecommended.map(
              (item) => (
                <div
                  key={normalizeId(
                    item.id,
                  )}
                  className="
                    rounded-xl
                    border
                    border-red-100
                    bg-white
                    p-4
                  "
                >
                  <div
                    className="
                      font-medium
                      text-black
                    "
                  >
                    {item.name}
                  </div>

                  <div
                    className="
                      mt-1
                      text-sm
                      text-red-600
                    "
                  >
                    {item.reason}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {/* =================================================
          Suggestions
      ================================================= */}

      {suggestions.length >
        0 && (
        <section
          className="
            rounded-2xl
            border
            border-blue-200
            bg-blue-50
            p-5
          "
        >
          <h3
            className="
              text-lg
              font-semibold
              text-blue-700
              mb-4
            "
          >
            Refine your
            search
          </h3>

          <div
            className="
              flex
              flex-wrap
              gap-3
            "
          >
            {suggestions.map(
              (
                suggestion: SuggestionItem,
              ) => {
                const action =
                  suggestion.action?.trim();

                return (
                  <button
                    key={normalizeId(
                      suggestion.id,
                    )}
                    type="button"
                    disabled={!action}
                    onClick={() => {
                      if (!action) {
                        return;
                      }

                      router.push(
                        `/search?q=${encodeURIComponent(
                          action,
                        )}`,
                      );
                    }}
                    className="
                      rounded-full
                      border
                      border-blue-200
                      bg-white
                      px-4
                      py-2
                      text-sm
                      text-gray-800
                      transition
                      hover:bg-blue-100
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {suggestion.title}
                  </button>
                );
              },
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ======================================================
// Product Collection
// ======================================================

function buildUniqueProducts(
  best: ProductItem | null,
  recommendations: ProductItem[],
): ProductItem[] {
  const products: ProductItem[] =
    [];

  const appendUnique = (
    product:
      | ProductItem
      | null
      | undefined,
  ): void => {
    if (!product) {
      return;
    }

    const id =
      normalizeId(
        product.id,
      );

    if (!id) {
      return;
    }

    const exists =
      products.some(
        (existing) =>
          normalizeId(
            existing.id,
          ) === id,
      );

    if (!exists) {
      products.push(
        product,
      );
    }
  };

  appendUnique(best);

  for (
    const product of
      recommendations
  ) {
    appendUnique(product);
  }

  return products;
}

// ======================================================
// Best Metrics
// ======================================================

function buildBestMetrics(
  products: ProductItem[],
  priority: MetricKey[],
): Partial<
  Record<MetricKey, string>
> {
  const result: Partial<
    Record<MetricKey, string>
  > = {};

  if (
    products.length < 2
  ) {
    return result;
  }

  for (
    const metric of priority
  ) {
    const winner =
      findMetricWinner(
        products,
        metric,
      );

    if (!winner) {
      continue;
    }

    result[metric] =
      normalizeId(
        winner.id,
      );
  }

  return result;
}

// ======================================================
// Strongest Area
// ======================================================

function getStrongestArea(
  best: ProductItem | null,
  bestMetrics: Partial<
    Record<MetricKey, string>
  >,
  priority: MetricKey[],
): string | null {
  if (!best) {
    return null;
  }

  const bestId =
    normalizeId(
      best.id,
    );

  for (
    const metric of priority
  ) {
    if (
      bestMetrics[metric] ===
      bestId
    ) {
      return METRIC_LABELS[
        metric
      ];
    }
  }

  return null;
}