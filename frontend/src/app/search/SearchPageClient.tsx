"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { useSearchParams } from "next/navigation"

import SearchBar from "@/features/search/components/SearchBar"
import Results from "@/features/search/components/Results"
import { useSearch } from "@/features/search/hooks/useSearch"
import Skeleton from "@/components/ui/Skeleton"

// ======================================================
// Types
// ======================================================

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

// ======================================================
// Hydration
// ======================================================

function subscribe() {
  return () => {}
}

function getClientSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

// ======================================================
// Component
// ======================================================

export default function SearchPageClient({
  initialQuery = "",
}: {
  initialQuery?: string
}) {
  const params = useSearchParams()

  const queryFromURL =
    params.get("q")?.trim() || ""

  const query =
    queryFromURL ||
    initialQuery.trim()

  const {
    search,
    loading,
    data,
    error,
  } = useSearch()

  // ====================================================
  // Intent
  // ====================================================

  const [intent, setIntent] =
    useState<SearchIntent>("balanced")

  // ====================================================
  // Compare Selection
  // ====================================================

  const [selected, setSelected] =
    useState<string[]>(() => {
      if (
        typeof window === "undefined"
      ) {
        return []
      }

      try {
        const stored =
          JSON.parse(
            localStorage.getItem(
              "compare_ids"
            ) || "[]"
          )

        if (Array.isArray(stored)) {
          return stored.map((id) =>
            String(id)
          )
        }
      } catch {
        // Ignore invalid localStorage data.
      }

      return []
    })

  // ====================================================
  // Hydration State
  // ====================================================

  const mounted =
    useSyncExternalStore(
      subscribe,
      getClientSnapshot,
      getServerSnapshot
    )

  // ====================================================
  // Search Request Tracking
  // ====================================================

  const requestIdRef =
    useRef(0)

  // ====================================================
  // Search
  // ====================================================

  const executeSearch =
    useCallback(async () => {
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

      // The hook owns the actual response state.
      // requestId is retained here so future request
      // cancellation/abort handling can be added without
      // changing the component contract.
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
    ])

  // ====================================================
  // Trigger Search
  //
  // IMPORTANT:
  // This effect intentionally depends on BOTH query
  // and intent.
  //
  // Previously:
  //
  //   if (query !== lastQueryRef.current)
  //
  // prevented an intent-only change from triggering
  // another API request.
  // ====================================================

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

  // ====================================================
  // Selection
  // ====================================================

  const toggleSelect = useCallback(
    (id: string) => {
      const normalizedId =
        String(id)

      setSelected((previous) => {
        if (
          previous.includes(
            normalizedId
          )
        ) {
          return previous.filter(
            (item) =>
              item !== normalizedId
          )
        }

        if (
          previous.length >= 4
        ) {
          return previous
        }

        return [
          ...previous,
          normalizedId,
        ]
      })
    },
    []
  )

  // ====================================================
  // Compare
  // ====================================================

  const handleCompare =
    useCallback(() => {
      if (
        selected.length < 2
      ) {
        return
      }

      localStorage.setItem(
        "compare_ids",
        JSON.stringify(selected)
      )

      window.dispatchEvent(
        new Event(
          "compare_update"
        )
      )

      window.location.href =
        "/compare"
    }, [selected])

  // ====================================================
  // Intent Change
  // ====================================================

  const handleIntentChange =
    useCallback(
      (nextIntent: SearchIntent) => {
        setIntent(nextIntent)
      },
      []
    )

  // ====================================================
  // Render
  // ====================================================

  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto w-full max-w-4xl">

        {/* ==================================================
            Search Bar
        ================================================== */}

        <div className="mb-6 flex justify-center md:mb-8">
          <SearchBar
            initialValue={query}
          />
        </div>

        {/* ==================================================
            Intent Selector
        ================================================== */}

        <div className="mb-5 flex flex-wrap justify-center gap-2 px-1 md:mb-6">
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
                  className={[
                    "rounded-full",
                    "border",
                    "px-3",
                    "py-2",
                    "text-xs",
                    "transition",
                    "active:scale-95",
                    "md:px-4",
                    "md:text-sm",
                    active
                      ? "bg-black text-white shadow-md"
                      : "bg-white text-black hover:bg-gray-100",
                  ].join(" ")}
                >
                  {type}
                </button>
              )
            }
          )}
        </div>

        {/* ==================================================
            Search Context
        ================================================== */}

        {query && (
          <h1 className="mb-5 break-words px-2 text-center text-lg font-semibold text-black md:mb-6 md:text-xl">
            Showing results for &quot;
            {query}
            &quot;
          </h1>
        )}

        {/* ==================================================
            Loading
        ================================================== */}

        {loading && (
          <div className="space-y-3 p-2 md:space-y-4 md:p-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {/* ==================================================
            Error
        ================================================== */}

        {!loading && error && (
          <div className="space-y-4 py-10 text-center">
            <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void executeSearch()
              }
              disabled={
                !query.trim()
              }
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* ==================================================
            Results
        ================================================== */}

        {!loading &&
          !error &&
          data && (
            <div className="mt-5 flex justify-center md:mt-6">
              <Results
                data={data}
                selected={selected}
                onSelect={toggleSelect}
              />
            </div>
          )}

        {/* ==================================================
            Compare Button
        ================================================== */}

        {mounted &&
          selected.length >= 2 && (
            <button
              type="button"
              onClick={
                handleCompare
              }
              className="fixed bottom-4 right-4 z-50 rounded-2xl bg-black px-5 py-3 text-sm text-white shadow-xl transition hover:opacity-90 active:scale-95 md:bottom-6 md:right-6 md:px-6 md:text-base"
            >
              Compare (
              {selected.length}
              /4)
            </button>
          )}
      </div>
    </div>
  )
}