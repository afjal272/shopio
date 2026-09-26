"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  SlidersHorizontal,
  Sparkles,
  XCircle,
} from "lucide-react"

import ResultCard from "./ResultCard"

import {
  SearchResponse,
  SuggestionItem,
  ProductItem,
} from "@/types/search"

interface ResultsProps {
  data: SearchResponse
  selected?: string[]
  onSelect?: (id: string) => void
}

type MetricKey =
  | "ram"
  | "processor"
  | "battery"
  | "camera"
  | "rating"

type MetricValue = number | null

const EMPTY_PRODUCTS: ProductItem[] = []
const EMPTY_STRINGS: string[] = []

const EMPTY_NOT_RECOMMENDED: SearchResponse["notRecommended"] =
  []

const EMPTY_SUGGESTIONS: SuggestionItem[] = []

const EMPTY_PARSED: SearchResponse["parsed"] = {
  intent: [],
  budget: null,
}

const METRIC_LABELS: Record<
  MetricKey,
  string
> = {
  ram: "RAM",
  processor: "Processor",
  battery: "Battery",
  camera: "Camera",
  rating: "Rating",
}

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
}

// ======================================================
// Helpers
// ======================================================

function normalizeId(
  value: unknown
): string {
  return String(value ?? "")
}

function normalizeIntentList(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((item) =>
      item.trim().toLowerCase()
    )
    .filter(Boolean)
}

function getSafeBudget(
  value: unknown
): number | null {
  const budget = Number(value)

  return Number.isFinite(budget) &&
    budget > 0
    ? budget
    : null
}

function formatBudget(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value)
}

function safeNumericValue(
  value: unknown
): number {
  const numeric = Number(value)

  return Number.isFinite(numeric)
    ? numeric
    : 0
}

function safeScore(
  value: unknown
): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        safeNumericValue(value)
      )
    )
  )
}

function isPositiveFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  )
}

function capitalize(
  value: string
): string {
  if (!value) {
    return ""
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  )
}

function getMetricPriority(
  intents: string[]
): MetricKey[] {
  for (const intent of intents) {
    const normalized = intent
      .trim()
      .toLowerCase()

    const priority =
      INTENT_PRIORITY[normalized]

    if (priority) {
      return priority
    }
  }

  return INTENT_PRIORITY.balanced
}

function getMetricValue(
  product: ProductItem,
  metric: MetricKey
): MetricValue {
  switch (metric) {
    case "ram": {
      const value =
        product.specs?.ram

      return isPositiveFiniteNumber(
        value
      )
        ? value
        : null
    }

    case "battery": {
      const value =
        product.specs?.battery

      return isPositiveFiniteNumber(
        value
      )
        ? value
        : null
    }

    case "camera": {
      const value =
        product.specs?.cameraMp

      return isPositiveFiniteNumber(
        value
      )
        ? value
        : null
    }

    case "rating": {
      const value =
        product.rating

      return isPositiveFiniteNumber(
        value
      )
        ? value
        : null
    }

    case "processor": {
      /*
       * Processor comparison uses the
       * normalized decision-engine signal.
       */
      const value =
        product.breakdown?.processor

      return isPositiveFiniteNumber(
        value
      )
        ? value
        : null
    }

    default:
      return null
  }
}

function findMetricWinner(
  products: ProductItem[],
  metric: MetricKey
): ProductItem | null {
  const candidates =
    products.filter(
      (product) => {
        const value =
          getMetricValue(
            product,
            metric
          )

        return (
          value !== null &&
          value > 0
        )
      }
    )

  if (candidates.length < 2) {
    return null
  }

  return (
    [...candidates].sort(
      (a, b) => {
        const aValue =
          getMetricValue(
            a,
            metric
          ) ?? 0

        const bValue =
          getMetricValue(
            b,
            metric
          ) ?? 0

        if (
          bValue !==
          aValue
        ) {
          return (
            bValue -
            aValue
          )
        }

        return (
          safeNumericValue(
            b.score
          ) -
          safeNumericValue(
            a.score
          )
        )
      }
    )[0] ?? null
  )
}

// ======================================================
// Component
// ======================================================

export default function Results({
  data,
  selected = [],
  onSelect,
}: ResultsProps) {
  const router = useRouter()

  // ====================================================
  // Defensive normalization
  // ====================================================

  const best =
    data?.best ?? null

  const recommendations =
    Array.isArray(
      data?.recommendations
    )
      ? data.recommendations
      : EMPTY_PRODUCTS

  const parsed =
    data?.parsed ??
    EMPTY_PARSED

  const comparison =
    Array.isArray(
      data?.comparison
    )
      ? data.comparison
      : EMPTY_STRINGS

  const notRecommended =
    Array.isArray(
      data?.notRecommended
    )
      ? data.notRecommended
      : EMPTY_NOT_RECOMMENDED

  const suggestions =
    Array.isArray(
      data?.suggestions
    )
      ? data.suggestions
      : EMPTY_SUGGESTIONS

  const isRelaxed =
    Boolean(data?.isRelaxed)

  const budget =
    getSafeBudget(
      parsed.budget
    )

  const intents =
    normalizeIntentList(
      parsed.intent
    )

  // ====================================================
  // Persist latest results
  // ====================================================

  useEffect(() => {
    if (!best) {
      return
    }

    try {
      localStorage.setItem(
        "last_results",
        JSON.stringify([
          best,
          ...recommendations,
        ])
      )
    } catch (error) {
      console.error(
        "Failed to persist search results:",
        error
      )
    }
  }, [
    best,
    recommendations,
  ])

  // ====================================================
  // Decision signals
  // ====================================================

  const allProducts =
    buildUniqueProducts(
      best,
      recommendations
    )

  const metricPriority =
    getMetricPriority(
      intents
    )

  const bestMetrics =
    buildBestMetrics(
      allProducts,
      metricPriority
    )

  const strongestArea =
    getStrongestArea(
      best,
      bestMetrics,
      metricPriority
    )

  const hasRecommendations =
    recommendations.length > 0

  const noResults =
    !best &&
    !hasRecommendations &&
    !isRelaxed

  const intentText =
    intents.length > 1
      ? intents
          .map(capitalize)
          .join(" & ")
      : capitalize(
          intents[0] ??
            "general"
        )

  const selectedSet =
    new Set(selected)

  // ====================================================
  // Empty state
  // ====================================================

  if (noResults) {
    return (
      <section className="flex min-h-[420px] w-full items-center justify-center py-16">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e4e6eb] bg-white text-[#8b919b] shadow-sm">
            <SlidersHorizontal
              size={22}
              strokeWidth={1.7}
              aria-hidden="true"
            />
          </div>

          <h2 className="mt-6 text-2xl font-semibold tracking-[-0.025em] text-[#262626]">
            No matching products found
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#656b76]">
            Try increasing your budget or changing
            your search preferences.
          </p>
        </div>
      </section>
    )
  }

  return (
    <div className="w-full space-y-10">
      {/* ==================================================
          RELAXED SEARCH
      ================================================== */}

      {isRelaxed && (
        <section
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
          role="status"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-amber-600"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-semibold text-amber-800">
                We widened the search slightly.
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                Your budget was restrictive, so Shopio
                is showing the closest matching products
                instead of returning nothing.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ==================================================
          SEARCH CONTEXT
      ================================================== */}

      <div className="flex flex-col gap-4 rounded-2xl border border-[#e5e7ec] bg-white px-5 py-4 shadow-[0_6px_24px_rgba(15,23,42,0.035)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9aa0aa]">
            Search context
          </p>

          <p className="mt-1 text-sm text-[#656b76]">
            Ranked for{" "}
            <span className="font-semibold text-[#262626]">
              {intentText}
            </span>

            {budget !== null && (
              <>
                {" "}
                under{" "}
                <span className="font-semibold text-[#262626]">
                  ₹{formatBudget(budget)}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f3f3ff] px-3 py-1.5 text-xs font-medium text-[#5b5ce2]">
          <Sparkles
            size={13}
            aria-hidden="true"
          />

          AI-ranked results
        </div>
      </div>

      {/* ==================================================
          BEST RECOMMENDATION
      ================================================== */}

      {best && (
        <section className="overflow-hidden rounded-[30px] border border-[#dfe2e9] bg-white shadow-[0_20px_65px_rgba(15,23,42,0.07)]">
          {/* Header */}
          <div className="relative overflow-hidden border-b border-[#e9ebf0] bg-gradient-to-br from-[#f7f7ff] via-white to-white px-6 py-7 sm:px-8 lg:px-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-indigo-100/30 blur-3xl"
            />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#686bd2]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5b5ce2]" />
                  Shopio recommendation
                </div>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#262626] sm:text-[2.2rem]">
                  Best match for this search
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#656b76]">
                  Highest-ranked product based on the
                  requirements and decision signals in your
                  search.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <div className="min-w-[78px] rounded-2xl border border-[#e1e3e9] bg-white px-4 py-3 text-center shadow-[0_5px_18px_rgba(15,23,42,0.05)]">
                  <p className="text-2xl font-semibold tracking-tight text-[#262626]">
                    {safeScore(
                      best.score
                    )}
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#969ca6]">
                    match
                  </p>
                </div>

                {best.confidence !==
                  undefined && (
                  <div className="min-w-[78px] rounded-2xl border border-[#e1e3e9] bg-white px-4 py-3 text-center shadow-[0_5px_18px_rgba(15,23,42,0.05)]">
                    <p className="text-2xl font-semibold tracking-tight text-[#262626]">
                      {safeScore(
                        best.confidence
                      )}
                    </p>

                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#969ca6]">
                      confidence
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="p-4 sm:p-6 lg:p-7">
            <ResultCard
              item={best}
              highlight
              selected={selectedSet.has(
                normalizeId(
                  best.id
                )
              )}
              onSelect={
                onSelect
                  ? () =>
                      onSelect(
                        normalizeId(
                          best.id
                        )
                      )
                  : undefined
              }
            />
          </div>

          {/* Decision reasoning */}
          {(strongestArea ||
            comparison.length > 0) && (
            <div className="border-t border-[#e9ebf0] bg-[#fafafc] px-5 py-5 sm:px-6 lg:px-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Strongest area */}
                {strongestArea && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eeeeff] text-[#5b5ce2]">
                      <Lightbulb
                        size={17}
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0aa]">
                        Strongest area
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-[#34373d]">
                        Best in{" "}
                        {strongestArea}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reasons */}
                {comparison.length >
                  0 && (
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {comparison
                      .slice(0, 3)
                      .map(
                        (
                          reason,
                          index
                        ) => (
                          <div
                            key={`${index}-${reason}`}
                            className="flex items-start gap-2 text-xs leading-5 text-[#656b76]"
                          >
                            <CheckCircle2
                              size={14}
                              className="mt-0.5 shrink-0 text-emerald-500"
                              aria-hidden="true"
                            />

                            <span>
                              {reason}
                            </span>
                          </div>
                        )
                      )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ==================================================
          SHORTLIST
      ================================================== */}

      {hasRecommendations && (
        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9aa0aa]">
                Shortlist
              </p>

              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#262626]">
                Other strong options
              </h3>

              <p className="mt-1 text-sm text-[#656b76]">
                Strong alternatives worth considering.
              </p>
            </div>

            <span className="w-fit rounded-full border border-[#e2e4ea] bg-white px-3 py-1.5 text-xs font-medium text-[#737984]">
              {recommendations.length} option
              {recommendations.length ===
              1
                ? ""
                : "s"}
            </span>
          </div>

          <div className="space-y-4">
            {recommendations.map(
              (
                product,
                index
              ) => (
                <ResultCard
                  key={normalizeId(
                    product.id
                  )}
                  item={product}
                  index={index}
                  selected={selectedSet.has(
                    normalizeId(
                      product.id
                    )
                  )}
                  onSelect={
                    onSelect
                      ? () =>
                          onSelect(
                            normalizeId(
                              product.id
                            )
                          )
                      : undefined
                  }
                />
              )
            )}
          </div>
        </section>
      )}

      {/* ==================================================
          FILTERED PRODUCTS
      ================================================== */}

      {notRecommended.length > 0 && (
        <section className="rounded-[24px] border border-[#f0dede] bg-[#fffafa] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0f0] text-[#c65b5b]">
              <XCircle
                size={19}
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#3f3f43]">
                Products Shopio filtered out
              </h3>

              <p className="mt-1 text-sm leading-6 text-[#7b6b6b]">
                These options did not align well enough
                with the requirements.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {notRecommended.map(
              (item) => (
                <div
                  key={normalizeId(
                    item.id
                  )}
                  className="rounded-2xl border border-[#f0e2e2] bg-white p-4"
                >
                  <p className="font-medium text-[#262626]">
                    {item.name}
                  </p>

                  <div className="mt-2 flex gap-2 text-sm leading-6 text-[#b05e5e]">
                    <XCircle
                      size={15}
                      className="mt-1 shrink-0"
                      aria-hidden="true"
                    />

                    <span>
                      {item.reason}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* ==================================================
          SEARCH REFINEMENT
      ================================================== */}

      {suggestions.length > 0 && (
        <section className="rounded-[24px] border border-[#e0e1ef] bg-[#f8f8ff] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eeeeff] text-[#5b5ce2]">
              <SlidersHorizontal
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#262626]">
                Refine your search
              </h3>

              <p className="mt-1 text-sm leading-6 text-[#656b76]">
                Try one of these directions to narrow
                the decision further.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {suggestions.map(
              (
                suggestion: SuggestionItem
              ) => {
                const action =
                  suggestion.action?.trim()

                return (
                  <button
                    key={normalizeId(
                      suggestion.id
                    )}
                    type="button"
                    disabled={!action}
                    onClick={() => {
                      if (!action) {
                        return
                      }

                      router.push(
                        `/search?q=${encodeURIComponent(
                          action
                        )}`
                      )
                    }}
                    className="group inline-flex items-center gap-2 rounded-full border border-[#dfe1ec] bg-white px-4 py-2.5 text-sm font-medium text-[#555b66] shadow-sm transition-all duration-200 hover:border-[#cfd1ee] hover:bg-[#f3f3ff] hover:text-[#4f46c8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>
                      {suggestion.title}
                    </span>

                    <ArrowRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                )
              }
            )}
          </div>
        </section>
      )}
    </div>
  )
}

// ======================================================
// Product Collection
// ======================================================

function buildUniqueProducts(
  best: ProductItem | null,
  recommendations: ProductItem[]
): ProductItem[] {
  const products: ProductItem[] = []

  const appendUnique = (
    product:
      | ProductItem
      | null
      | undefined
  ): void => {
    if (!product) {
      return
    }

    const id =
      normalizeId(product.id)

    if (!id) {
      return
    }

    const exists =
      products.some(
        (existing) =>
          normalizeId(
            existing.id
          ) === id
      )

    if (!exists) {
      products.push(product)
    }
  }

  appendUnique(best)

  for (
    const product of
    recommendations
  ) {
    appendUnique(product)
  }

  return products
}

// ======================================================
// Best Metrics
// ======================================================

function buildBestMetrics(
  products: ProductItem[],
  priority: MetricKey[]
): Partial<
  Record<MetricKey, string>
> {
  const result: Partial<
    Record<MetricKey, string>
  > = {}

  if (products.length < 2) {
    return result
  }

  for (
    const metric of priority
  ) {
    const winner =
      findMetricWinner(
        products,
        metric
      )

    if (!winner) {
      continue
    }

    result[metric] =
      normalizeId(
        winner.id
      )
  }

  return result
}

// ======================================================
// Strongest Area
// ======================================================

function getStrongestArea(
  best: ProductItem | null,
  bestMetrics: Partial<
    Record<MetricKey, string>
  >,
  priority: MetricKey[]
): string | null {
  if (!best) {
    return null
  }

  const bestId =
    normalizeId(best.id)

  for (
    const metric of priority
  ) {
    if (
      bestMetrics[metric] ===
      bestId
    ) {
      return METRIC_LABELS[
        metric
      ]
    }
  }

  return null
}