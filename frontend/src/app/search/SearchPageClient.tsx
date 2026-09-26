"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import { useSearchParams } from "next/navigation"

import SearchBar from "@/features/search/components/SearchBar"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"
import Skeleton from "@/components/ui/Skeleton"

type SearchIntent =
  | "balanced"
  | "gaming"
  | "camera"
  | "battery"

const SEARCH_INTENTS: readonly SearchIntent[] = [
  "balanced",
  "gaming",
  "camera",
  "battery",
]

const COMPARE_STORAGE_KEY = "compare_ids"
const COMPARE_EVENT = "compare_update"

const EMPTY_COMPARE_IDS: string[] = []

let compareSnapshotRaw = ""
let compareSnapshot: string[] = EMPTY_COMPARE_IDS

function readCompareIds(): string[] {
  if (typeof window === "undefined") {
    return EMPTY_COMPARE_IDS
  }

  const raw =
    window.localStorage.getItem(
      COMPARE_STORAGE_KEY
    ) ?? ""

  if (raw === compareSnapshotRaw) {
    return compareSnapshot
  }

  compareSnapshotRaw = raw

  try {
    const parsed: unknown = raw
      ? JSON.parse(raw)
      : []

    if (!Array.isArray(parsed)) {
      compareSnapshot = EMPTY_COMPARE_IDS
      return compareSnapshot
    }

    compareSnapshot = parsed
      .map((value) => String(value))
      .filter(Boolean)
      .slice(0, 4)

    return compareSnapshot
  } catch {
    compareSnapshot = EMPTY_COMPARE_IDS
    return compareSnapshot
  }
}

function subscribeToCompare(
  callback: () => void
) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleCompareUpdate = () => {
    compareSnapshotRaw = ""
    callback()
  }

  const handleStorage = (
    event: StorageEvent
  ) => {
    if (
      event.key === COMPARE_STORAGE_KEY ||
      event.key === null
    ) {
      compareSnapshotRaw = ""
      callback()
    }
  }

  window.addEventListener(
    COMPARE_EVENT,
    handleCompareUpdate
  )

  window.addEventListener(
    "storage",
    handleStorage
  )

  return () => {
    window.removeEventListener(
      COMPARE_EVENT,
      handleCompareUpdate
    )

    window.removeEventListener(
      "storage",
      handleStorage
    )
  }
}

function getServerCompareSnapshot() {
  return EMPTY_COMPARE_IDS
}

export default function SearchPageClient({
  initialQuery = "",
}: {
  initialQuery?: string
}) {
  const params = useSearchParams()

  const queryFromURL =
    params.get("q")?.trim() || ""

  const query =
    queryFromURL || initialQuery.trim()

  const {
    search,
    loading,
    data,
    error,
  } = useSearch()

  const [intent, setIntent] =
    useState<SearchIntent>("balanced")

  const selected = useSyncExternalStore(
    subscribeToCompare,
    readCompareIds,
    getServerCompareSnapshot
  )

  const requestIdRef = useState(() => ({
    current: 0,
  }))[0]

  const executeSearch = useCallback(async () => {
    const normalizedQuery =
      query.trim()

    if (!normalizedQuery) {
      return
    }

    const requestId =
      ++requestIdRef.current

    await search(
      normalizedQuery,
      [intent]
    )

    if (
      requestId !==
      requestIdRef.current
    ) {
      return
    }
  }, [
    query,
    intent,
    search,
    requestIdRef,
  ])

  useEffect(() => {
    if (!query.trim()) {
      return
    }

    void executeSearch()
  }, [
    query,
    intent,
    executeSearch,
  ])

  const toggleSelect = useCallback(
    (id: string) => {
      const normalizedId = String(id)

      const updated = selected.includes(
        normalizedId
      )
        ? selected.filter(
            (item) =>
              item !== normalizedId
          )
        : selected.length >= 4
          ? selected
          : [
              ...selected,
              normalizedId,
            ]

      try {
        window.localStorage.setItem(
          COMPARE_STORAGE_KEY,
          JSON.stringify(updated)
        )

        compareSnapshotRaw = ""
        compareSnapshot = updated

        window.dispatchEvent(
          new Event(COMPARE_EVENT)
        )
      } catch {
        // Ignore localStorage failures.
      }
    },
    [selected]
  )

  const handleCompare = useCallback(() => {
    if (selected.length < 2) {
      return
    }

    try {
      window.localStorage.setItem(
        COMPARE_STORAGE_KEY,
        JSON.stringify(selected)
      )

      compareSnapshotRaw = ""

      window.dispatchEvent(
        new Event(COMPARE_EVENT)
      )
    } catch {
      return
    }

    window.location.assign("/compare")
  }, [selected])

  const handleIntentChange = useCallback(
    (nextIntent: SearchIntent) => {
      if (nextIntent === intent) {
        return
      }

      setIntent(nextIntent)
    },
    [intent]
  )

  const activeIntentLabel =
    intent === "balanced"
      ? "Balanced"
      : intent === "gaming"
        ? "Gaming"
        : intent === "camera"
          ? "Camera"
          : "Battery"

  const intentDescription = useMemo(() => {
    switch (intent) {
      case "gaming":
        return "Ranking emphasizes performance and gaming needs."

      case "camera":
        return "Ranking emphasizes camera-related priorities."

      case "battery":
        return "Ranking emphasizes battery-focused requirements."

      default:
        return "Balanced ranking across your requirements."
    }
  }, [intent])

  return (
    <main className="min-h-screen bg-[#fafafc] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-6xl">
        {/* Search */}
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[28px] border border-[#e5e7ec] bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            <SearchBar initialValue={query} />
          </div>
        </div>

        {/* Context */}
        <div className="mt-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8f98]">
                Product intelligence
              </p>

              <h1 className="mt-3 break-words text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#262626] sm:text-4xl">
                {query
                  ? `Results for "${query}"`
                  : "Find the right product"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#656b76] sm:text-base">
                {query
                  ? "BeforeChoice ranks products around your requirements instead of simply listing more options."
                  : "Describe what you need and BeforeChoice will help narrow the options down."}
              </p>
            </div>

            {query && (
              <div className="shrink-0 rounded-2xl border border-[#e3e5eb] bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa0aa]">
                  Ranking mode
                </p>

                <p className="mt-1 text-sm font-semibold text-[#454a53]">
                  {activeIntentLabel}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Intent */}
        <div className="mt-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-[#e5e7ec] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="text-sm font-semibold text-[#454a53]">
                What matters most?
              </p>

              <p className="mt-1 text-xs text-[#8a8f98]">
                {intentDescription}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {SEARCH_INTENTS.map(
                (type) => {
                  const active =
                    intent === type

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        handleIntentChange(
                          type
                        )
                      }
                      aria-pressed={active}
                      className={`rounded-full border px-3.5 py-2 text-xs font-medium capitalize transition-all duration-200 sm:text-sm ${
                        active
                          ? "border-[#171717] bg-[#171717] text-white shadow-sm"
                          : "border-[#e2e4ea] bg-white text-[#656b76] hover:border-[#d5d8df] hover:bg-[#fafafc] hover:text-[#262626]"
                      }`}
                    >
                      {type}
                    </button>
                  )
                }
              )}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <section
            className="mt-10"
            aria-label="Loading search results"
          >
            <div className="mb-5">
              <div className="h-6 w-40 animate-pulse rounded bg-[#e9ebef]" />
            </div>

            <div className="space-y-5">
              <Skeleton className="h-48 w-full rounded-[24px]" />
              <Skeleton className="h-40 w-full rounded-[24px]" />
              <Skeleton className="h-40 w-full rounded-[24px]" />
            </div>
          </section>
        )}

        {/* Error */}
        {!loading && error && (
          <section className="mt-10">
            <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm font-medium text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void executeSearch()
                }
                disabled={!query.trim()}
                className="mt-5 rounded-xl bg-[#171717] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Try again
              </button>
            </div>
          </section>
        )}

        {/* Results */}
        {!loading &&
          !error &&
          data !== null &&
          data !== undefined && (
            <section className="mt-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-[#262626]">
                    Recommended products
                  </h2>

                  <p className="mt-1 text-xs text-[#8a8f98]">
                    Ranked using your current preferences
                  </p>
                </div>

                {selected.length > 0 && (
                  <div className="rounded-full border border-[#e2e4ea] bg-white px-3 py-1.5 text-xs font-medium text-[#656b76]">
                    {selected.length} selected
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-[#e7e9ee] bg-white p-3 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-5">
                <Results
                  data={data}
                  selected={selected}
                  onSelect={toggleSelect}
                />
              </div>
            </section>
          )}

        {/* Empty query */}
        {!query &&
          !loading &&
          !error && (
            <section className="mt-10 rounded-[28px] border border-[#e7e9ee] bg-white p-8 text-center shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-12">
              <div className="mx-auto max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a8f98]">
                  Start with a question
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#262626] sm:text-3xl">
                  Tell BeforeChoice what you are looking for.
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#656b76] sm:text-base">
                  Try something like “best phone under
                  ₹30,000 for gaming” and let the decision
                  engine narrow it down.
                </p>
              </div>
            </section>
          )}
      </div>

      {/* Compare action */}
      {selected.length >= 2 && (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center">
          <div className="pointer-events-auto rounded-2xl border border-[#dfe2e8] bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl">
            <button
              type="button"
              onClick={handleCompare}
              className="rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-black hover:shadow-md active:scale-[0.98] sm:px-6 sm:text-base"
            >
              Compare {selected.length} products
            </button>
          </div>
        </div>
      )}
    </main>
  )
}