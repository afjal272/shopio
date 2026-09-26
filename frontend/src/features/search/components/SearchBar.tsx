"use client"

import {
  ArrowUpRight,
  Clock3,
  Loader2,
  Search,
} from "lucide-react"
import {
  FormEvent,
  KeyboardEvent,
  useMemo,
  useState,
} from "react"
import {
  usePathname,
  useRouter,
} from "next/navigation"

interface SearchBarProps {
  initialValue?: string
}

const STATIC_SUGGESTIONS = [
  "best gaming phone",
  "best phone under 20000",
  "best camera phone",
  "best laptop for coding",
]

const MAX_RECENT_SEARCHES = 5
const MAX_SUGGESTIONS = 8

const SEARCH_INPUT_ID = "shopio-product-search"
const SEARCH_LISTBOX_ID = "shopio-search-suggestions"

const getSuggestionId = (index: number) =>
  `shopio-search-suggestion-${index}`

export default function SearchBar({
  initialValue = "",
}: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [query, setQuery] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] =
    useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const [recentSearches, setRecentSearches] =
    useState<string[]>([])

  const [clickData, setClickData] =
    useState<Record<string, number>>({})

  const loadLocalSearchData = () => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const storedRecent =
        window.localStorage.getItem("recent_searches")

      if (storedRecent) {
        const parsed: unknown = JSON.parse(
          storedRecent
        )

        if (Array.isArray(parsed)) {
          const validRecent = parsed
            .filter(
              (value): value is string =>
                typeof value === "string"
            )
            .map((value) => value.trim())
            .filter(Boolean)
            .slice(0, MAX_RECENT_SEARCHES)

          setRecentSearches(validRecent)
        }
      }

      const storedClicks =
        window.localStorage.getItem("search_clicks")

      if (storedClicks) {
        const parsed: unknown = JSON.parse(
          storedClicks
        )

        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          const safeClickData: Record<string, number> =
            {}

          for (const [key, value] of Object.entries(
            parsed
          )) {
            const numericValue = Number(value)

            if (
              Number.isFinite(numericValue) &&
              numericValue >= 0
            ) {
              safeClickData[key] = numericValue
            }
          }

          setClickData(safeClickData)
        }
      }
    } catch {
      setRecentSearches([])
      setClickData({})
    }
  }

  const saveRecentSearch = (value: string) => {
    const normalized = value.trim()

    if (!normalized) {
      return
    }

    const updated = [
      normalized,
      ...recentSearches.filter(
        (item) =>
          item.toLowerCase() !==
          normalized.toLowerCase()
      ),
    ].slice(0, MAX_RECENT_SEARCHES)

    setRecentSearches(updated)

    try {
      window.localStorage.setItem(
        "recent_searches",
        JSON.stringify(updated)
      )
    } catch {
      // Ignore localStorage failures.
    }
  }

  const trackSearch = (value: string) => {
    const normalized = value.trim()

    if (!normalized) {
      return
    }

    const updated = {
      ...clickData,
      [normalized]:
        (clickData[normalized] ?? 0) + 1,
    }

    setClickData(updated)

    try {
      window.localStorage.setItem(
        "search_clicks",
        JSON.stringify(updated)
      )
    } catch {
      // Ignore localStorage failures.
    }
  }

  const navigateToSearch = (value: string) => {
    const normalized = value.trim()

    if (!normalized) {
      return
    }

    const target = `/search?q=${encodeURIComponent(
      normalized
    )}`

    setLoading(true)
    setShowSuggestions(false)
    setActiveIndex(-1)

    saveRecentSearch(normalized)
    trackSearch(normalized)

    /*
     * SearchPageClient needs a fresh URL-derived query when
     * the user searches again from the existing /search page.
     */
    if (pathname === "/search") {
      window.location.assign(target)
      return
    }

    router.push(target)
  }

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()

    const normalized = query.trim()

    if (!normalized) {
      return
    }

    navigateToSearch(normalized)
  }

  const handleSelect = (value: string) => {
    const normalized = value.trim()

    if (!normalized) {
      return
    }

    setQuery(normalized)
    navigateToSearch(normalized)
  }

  const normalizedQuery = query.trim()
  const normalizedQueryLower = normalizedQuery.toLowerCase()

  const dynamicSuggestions = useMemo(() => {
    if (normalizedQuery.length < 2) {
      return []
    }

    return [
      `${normalizedQuery} under 15000`,
      `${normalizedQuery} under 20000`,
      `best ${normalizedQuery}`,
      `${normalizedQuery} with 8GB RAM`,
      `${normalizedQuery} for gaming`,
    ]
  }, [normalizedQuery])

  const filteredStaticSuggestions = useMemo(
    () =>
      STATIC_SUGGESTIONS.filter(
        (suggestion) =>
          !normalizedQuery ||
          suggestion
            .toLowerCase()
            .includes(normalizedQueryLower)
      ),
    [normalizedQuery, normalizedQueryLower]
  )

  const recentItems = useMemo(
    () =>
      recentSearches
        .filter(
          (item) =>
            !normalizedQuery ||
            item
              .toLowerCase()
              .includes(normalizedQueryLower)
        )
        .slice(0, 3),
    [
      recentSearches,
      normalizedQuery,
      normalizedQueryLower,
    ]
  )

  const recommendedItems = useMemo(() => {
    const recentSet = new Set(
      recentSearches.map((item) =>
        item.trim().toLowerCase()
      )
    )

    return Array.from(
      new Set([
        ...filteredStaticSuggestions,
        ...dynamicSuggestions,
      ])
    )
      .filter((value) => {
        const normalizedValue =
          value.trim().toLowerCase()

        return (
          normalizedValue.length > 0 &&
          !recentSet.has(normalizedValue)
        )
      })
      .sort(
        (a, b) =>
          (clickData[b] ?? 0) -
          (clickData[a] ?? 0)
      )
      .slice(0, MAX_SUGGESTIONS)
  }, [
    clickData,
    dynamicSuggestions,
    filteredStaticSuggestions,
    recentSearches,
  ])

  const suggestions = useMemo(
    () =>
      [...recentItems, ...recommendedItems].slice(
        0,
        MAX_SUGGESTIONS
      ),
    [recentItems, recommendedItems]
  )

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()

      if (suggestions.length === 0) {
        return
      }

      setActiveIndex((current) =>
        current < suggestions.length - 1
          ? current + 1
          : 0
      )

      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()

      if (suggestions.length === 0) {
        return
      }

      setActiveIndex((current) =>
        current > 0
          ? current - 1
          : suggestions.length - 1
      )

      return
    }

    if (event.key === "Escape") {
      setShowSuggestions(false)
      setActiveIndex(-1)
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()

      if (
        activeIndex >= 0 &&
        activeIndex < suggestions.length
      ) {
        handleSelect(suggestions[activeIndex])
        return
      }

      handleSubmit()
    }
  }

  const highlightMatch = (text: string) => {
    const search = normalizedQuery

    if (!search) {
      return text
    }

    const escaped = search.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )

    const regex = new RegExp(
      `(${escaped})`,
      "gi"
    )

    return text.split(regex).map((part, index) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <span
          key={`${part}-${index}`}
          className="font-semibold text-[#171717]"
        >
          {part}
        </span>
      ) : (
        <span key={`${part}-${index}`}>
          {part}
        </span>
      )
    )
  }

  const hasSuggestions =
    showSuggestions && suggestions.length > 0

  const activeSuggestionId =
    activeIndex >= 0
      ? getSuggestionId(activeIndex)
      : undefined

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2"
        role="search"
      >
        <div className="relative min-w-0 flex-1">
          <label
            htmlFor={SEARCH_INPUT_ID}
            className="sr-only"
          >
            Search products
          </label>

          <Search
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8f98]"
          />

          <input
            id={SEARCH_INPUT_ID}
            type="search"
            role="combobox"
            value={query}
            autoComplete="off"
            maxLength={200}
            placeholder="What are you looking for?"
            aria-label="Search products"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-controls={
              hasSuggestions
                ? SEARCH_LISTBOX_ID
                : undefined
            }
            aria-expanded={hasSuggestions}
            aria-activedescendant={
              hasSuggestions
                ? activeSuggestionId
                : undefined
            }
            aria-busy={loading}
            enterKeyHint="search"
            className="h-12 w-full rounded-xl border border-[#e2e4ea] bg-white pl-11 pr-4 text-sm text-[#262626] outline-none transition-all duration-200 placeholder:text-[#9aa0aa] hover:border-[#d8dbe2] focus:border-[#c9cbe0] focus:ring-4 focus:ring-[#5b5ce2]/8 md:text-base"
            onChange={(event) => {
              setQuery(event.target.value)
              setShowSuggestions(true)
              setActiveIndex(-1)

              if (loading) {
                setLoading(false)
              }
            }}
            onFocus={() => {
              loadLocalSearchData()

              if (suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            onBlur={() => {
              window.setTimeout(() => {
                setShowSuggestions(false)
                setActiveIndex(-1)
              }, 150)
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          aria-label={
            loading
              ? "Searching products"
              : "Search products"
          }
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#171717] px-5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-black hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#171717] disabled:text-white disabled:opacity-100 md:px-6 md:text-base"
        >
          {loading ? (
            <>
              <Loader2
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
              <span>Searching...</span>
            </>
          ) : (
            "Search"
          )}
        </button>
      </form>

      {hasSuggestions && (
        <div
          id={SEARCH_LISTBOX_ID}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#e3e5ea] bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
        >
          {recentItems.length > 0 && (
            <div className="mb-1">
              <div
                id={`${SEARCH_LISTBOX_ID}-recent`}
                className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa0aa]"
              >
                <Clock3
                  size={13}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                Recent
              </div>

              {recentItems.map((suggestion) => {
                const suggestionIndex =
                  suggestions.indexOf(suggestion)

                const isActive =
                  suggestionIndex === activeIndex

                return (
                  <button
                    id={getSuggestionId(
                      suggestionIndex
                    )}
                    key={`recent-${suggestion}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onPointerDown={(event) => {
                      event.preventDefault()
                      handleSelect(suggestion)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors duration-150 ${
                      isActive
                        ? "bg-[#f3f3ff]"
                        : "hover:bg-[#f7f7f9]"
                    }`}
                  >
                    <span className="truncate text-[#4f555f]">
                      {highlightMatch(suggestion)}
                    </span>

                    <ArrowUpRight
                      size={14}
                      strokeWidth={1.7}
                      className="ml-3 shrink-0 text-[#a0a5ae]"
                      aria-hidden="true"
                    />
                  </button>
                )
              })}
            </div>
          )}

          {recommendedItems.length > 0 && (
            <div
              className={
                recentItems.length > 0
                  ? "border-t border-[#edf0f3] pt-1"
                  : ""
              }
            >
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa0aa]">
                {normalizedQuery
                  ? "Suggestions"
                  : "Popular searches"}
              </div>

              {recommendedItems.map((suggestion) => {
                const suggestionIndex =
                  suggestions.indexOf(suggestion)

                const isActive =
                  suggestionIndex === activeIndex

                return (
                  <button
                    id={getSuggestionId(
                      suggestionIndex
                    )}
                    key={`suggestion-${suggestion}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onPointerDown={(event) => {
                      event.preventDefault()
                      handleSelect(suggestion)
                    }}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors duration-150 ${
                      isActive
                        ? "bg-[#f3f3ff]"
                        : "hover:bg-[#f7f7f9]"
                    }`}
                  >
                    <span className="truncate text-[#4f555f]">
                      {highlightMatch(suggestion)}
                    </span>

                    <ArrowUpRight
                      size={14}
                      strokeWidth={1.7}
                      className="ml-3 shrink-0 text-[#b0b5bd] transition-colors group-hover:text-[#5b5ce2]"
                      aria-hidden="true"
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}