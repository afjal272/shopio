"use client";

import {
  FormEvent,
  KeyboardEvent,
  useState,
} from "react";

import { usePathname, useRouter } from "next/navigation";

// ======================================================
// Props
// ======================================================

interface SearchBarProps {
  initialValue?: string;
}

// ======================================================
// Constants
// ======================================================

const STATIC_SUGGESTIONS = [
  "best gaming phone",
  "best phone under 20000",
  "best camera phone",
  "best laptop for coding",
];

// ======================================================
// Component
// ======================================================

export default function SearchBar({
  initialValue = "",
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // ====================================================
  // State
  // ====================================================

  const [query, setQuery] =
    useState(initialValue);

  const [loading, setLoading] =
    useState(false);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [activeIndex, setActiveIndex] =
    useState(-1);

  const [recentSearches, setRecentSearches] =
    useState<string[]>([]);

  const [clickData, setClickData] =
    useState<Record<string, number>>({});

  // ====================================================
  // Load Local Search Data
  // ====================================================

  const loadLocalSearchData = () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedRecent =
        localStorage.getItem(
          "recent_searches"
        );

      if (storedRecent) {
        const parsed =
          JSON.parse(storedRecent);

        if (Array.isArray(parsed)) {
          setRecentSearches(
            parsed
              .filter(
                (value): value is string =>
                  typeof value === "string"
              )
              .slice(0, 5)
          );
        }
      }

      const storedClicks =
        localStorage.getItem(
          "search_clicks"
        );

      if (storedClicks) {
        const parsed =
          JSON.parse(storedClicks);

        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          setClickData(parsed);
        }
      }
    } catch {
      setRecentSearches([]);
      setClickData({});
    }
  };

  // ====================================================
  // Save Recent Search
  // ====================================================

  const saveRecentSearch = (
    value: string
  ) => {
    const normalized =
      value.trim();

    if (!normalized) {
      return;
    }

    const updated = [
      normalized,

      ...recentSearches.filter(
        (item) =>
          item.toLowerCase() !==
          normalized.toLowerCase()
      ),
    ].slice(0, 5);

    setRecentSearches(updated);

    localStorage.setItem(
      "recent_searches",
      JSON.stringify(updated)
    );
  };

  // ====================================================
  // Track Search
  // ====================================================

  const trackSearch = (
    value: string
  ) => {
    const normalized =
      value.trim();

    if (!normalized) {
      return;
    }

    const updated = {
      ...clickData,

      [normalized]:
        (clickData[normalized] ?? 0) + 1,
    };

    setClickData(updated);

    localStorage.setItem(
      "search_clicks",
      JSON.stringify(updated)
    );
  };

  // ====================================================
  // Navigate To Search
  // ====================================================

  const navigateToSearch = (
    value: string
  ) => {
    const normalized =
      value.trim();

    if (!normalized) {
      return;
    }

    const target =
      `/search?q=${encodeURIComponent(
        normalized
      )}`;

    setLoading(true);
    setShowSuggestions(false);
    setActiveIndex(-1);

    saveRecentSearch(normalized);
    trackSearch(normalized);

    /*
     * IMPORTANT:
     *
     * SearchPageClient currently keeps its own query
     * state and does not fully synchronize that state
     * after an in-place router.replace() on the same
     * /search route.
     *
     * Therefore, when already on /search, perform a
     * real browser navigation so the page initializes
     * from the new URL query.
     *
     * This guarantees:
     *
     * /search?q=20000
     *        ->
     * /search?q=25000
     *
     * actually triggers a fresh search.
     */

    if (pathname === "/search") {
      window.location.assign(target);
      return;
    }

    router.push(target);
  };

  // ====================================================
  // Submit
  // ====================================================

  const handleSubmit = (
    event?: FormEvent
  ) => {
    event?.preventDefault();

    const normalized =
      query.trim();

    if (!normalized) {
      return;
    }

    navigateToSearch(normalized);
  };

  // ====================================================
  // Suggestion Selection
  // ====================================================

  const handleSelect = (
    value: string
  ) => {
    const normalized =
      value.trim();

    if (!normalized) {
      return;
    }

    setQuery(normalized);

    navigateToSearch(normalized);
  };

  // ====================================================
  // Generate Dynamic Suggestions
  // ====================================================

  const normalizedQuery =
    query.trim();

  const dynamicSuggestions =
    normalizedQuery.length >= 2
      ? [
          `${normalizedQuery} under 15000`,
          `${normalizedQuery} under 20000`,
          `best ${normalizedQuery}`,
          `${normalizedQuery} with 8GB RAM`,
          `${normalizedQuery} for gaming`,
        ]
      : [];

  // ====================================================
  // Filter Static Suggestions
  // ====================================================

  const filteredStaticSuggestions =
    STATIC_SUGGESTIONS.filter(
      (suggestion) =>
        !normalizedQuery ||
        suggestion
          .toLowerCase()
          .includes(
            normalizedQuery.toLowerCase()
          )
    );

  // ====================================================
  // Merge Suggestions
  // ====================================================

  const filteredSuggestions =
    Array.from(
      new Set([
        ...recentSearches,
        ...filteredStaticSuggestions,
        ...dynamicSuggestions,
      ])
    )
      .filter(
        (value) =>
          value.trim().length > 0
      )
      .sort(
        (a, b) =>
          (clickData[b] ?? 0) -
          (clickData[a] ?? 0)
      )
      .slice(0, 8);

  // ====================================================
  // Keyboard Navigation
  // ====================================================

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "ArrowDown"
    ) {
      event.preventDefault();

      if (
        filteredSuggestions.length ===
        0
      ) {
        return;
      }

      setActiveIndex((current) =>
        current <
        filteredSuggestions.length - 1
          ? current + 1
          : 0
      );

      return;
    }

    if (
      event.key === "ArrowUp"
    ) {
      event.preventDefault();

      if (
        filteredSuggestions.length ===
        0
      ) {
        return;
      }

      setActiveIndex((current) =>
        current > 0
          ? current - 1
          : filteredSuggestions.length - 1
      );

      return;
    }

    if (
      event.key === "Escape"
    ) {
      setShowSuggestions(false);
      setActiveIndex(-1);

      return;
    }

    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      if (
        activeIndex >= 0 &&
        activeIndex <
          filteredSuggestions.length
      ) {
        handleSelect(
          filteredSuggestions[
            activeIndex
          ]
        );

        return;
      }

      handleSubmit();
    }
  };

  // ====================================================
  // Highlight Search Match
  // ====================================================

  const highlightMatch = (
    text: string
  ) => {
    const search =
      normalizedQuery;

    if (!search) {
      return text;
    }

    const escaped =
      search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const regex =
      new RegExp(
        `(${escaped})`,
        "gi"
      );

    return text
      .split(regex)
      .map((part, index) => {
        if (
          part.toLowerCase() ===
          search.toLowerCase()
        ) {
          return (
            <span
              key={index}
              className="font-semibold text-black"
            >
              {part}
            </span>
          );
        }

        return (
          <span key={index}>
            {part}
          </span>
        );
      });
  };

  // ====================================================
  // Render
  // ====================================================

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2"
      >
        {/* ==================================================
            Input
            ================================================== */}

        <input
          type="search"
          value={query}
          autoComplete="off"
          placeholder="e.g. best phone under 20000 for gaming"
          aria-label="Search products"
          className="
            min-w-0
            flex-1
            rounded-xl
            border
            border-gray-300
            bg-white
            px-4
            py-3
            text-sm
            text-black
            outline-none
            transition
            placeholder:text-gray-400
            focus:border-black
            focus:ring-2
            focus:ring-black/10
            md:text-base
          "
          onChange={(event) => {
            setQuery(
              event.target.value
            );

            setShowSuggestions(true);
            setActiveIndex(-1);

            /*
             * If the user edits the query after
             * a previous search, allow the button
             * to return to normal immediately.
             */
            if (loading) {
              setLoading(false);
            }
          }}
          onFocus={() => {
            loadLocalSearchData();

            if (
              filteredSuggestions.length > 0
            ) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setShowSuggestions(false);
              setActiveIndex(-1);
            }, 150);
          }}
          onKeyDown={handleKeyDown}
        />

        {/* ==================================================
            Search Button
            ================================================== */}

        <button
          type="submit"
          disabled={
            loading ||
            !query.trim()
          }
          className="
            shrink-0
            rounded-xl
            bg-black
            px-5
            py-3
            text-sm
            font-medium
            text-white
            transition
            hover:bg-gray-800
            active:scale-95
            disabled:cursor-not-allowed
            disabled:opacity-50
            md:text-base
          "
        >
          {loading
            ? "Searching..."
            : "Search"}
        </button>
      </form>

      {/* ==================================================
          Suggestions
          ================================================== */}

      {showSuggestions &&
        filteredSuggestions.length > 0 && (
          <div
            className="
              absolute
              left-0
              right-0
              top-full
              z-50
              mt-2
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-white
              shadow-xl
            "
          >
            {recentSearches.length > 0 && (
              <div className="border-b border-gray-100 px-4 py-2 text-xs font-medium text-gray-400">
                Recent searches
              </div>
            )}

            {filteredSuggestions.map(
              (suggestion, index) => (
                <button
                  key={`${suggestion}-${index}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();

                    handleSelect(
                      suggestion
                    );
                  }}
                  className={`
                    block
                    w-full
                    px-4
                    py-3
                    text-left
                    text-sm
                    transition
                    ${
                      index === activeIndex
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                    }
                  `}
                >
                  {highlightMatch(
                    suggestion
                  )}
                </button>
              )
            )}
          </div>
        )}
    </div>
  );
}