"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Heart, X, ArrowRight } from "lucide-react"

export default function Header() {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  const closeSearch = () => {
    setOpen(false)
  }

  const handleSearch = () => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      inputRef.current?.focus()
      return
    }

    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    setOpen(false)
  }

  const openSearch = () => {
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSearch()
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!searchRef.current) return

      const target = event.target as Node

      if (!searchRef.current.contains(target)) {
        closeSearch()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("pointerdown", handlePointerDown)

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 40)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("pointerdown", handlePointerDown)
      window.clearTimeout(focusTimer)
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#eceef2] bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-[21px] font-semibold tracking-[-0.04em] text-[#262626] transition-opacity hover:opacity-75"
        >
          BeforeChoice
        </Link>

        {/* Center Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-[#69707b] transition-colors duration-200 hover:text-[#262626]"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="text-sm font-medium text-[#69707b] transition-colors duration-200 hover:text-[#262626]"
          >
            How it works
          </a>

          <a
            href="#trust"
            className="text-sm font-medium text-[#69707b] transition-colors duration-200 hover:text-[#262626]"
          >
            Why BeforeChoice
          </a>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Search */}
          <div ref={searchRef} className="relative">
            <button
              type="button"
              onClick={() => {
                if (open) {
                  closeSearch()
                } else {
                  openSearch()
                }
              }}
              className={[
                "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                open
                  ? "bg-[#f3f4f7] text-[#262626]"
                  : "text-[#555b66] hover:bg-[#f5f6f8] hover:text-[#262626]",
              ].join(" ")}
              aria-label={open ? "Close search" : "Open search"}
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              {open ? (
                <X size={18} strokeWidth={1.8} />
              ) : (
                <Search size={19} strokeWidth={1.8} />
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-[calc(100%+14px)] w-[min(420px,calc(100vw-2rem))]">
                <div className="rounded-2xl border border-[#e3e5ea] bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                  <div className="flex items-center gap-2 rounded-xl border border-[#e6e8ed] bg-[#fafafc] p-1.5 transition-colors focus-within:border-[#d5d7df] focus-within:bg-white">
                    <Search
                      size={18}
                      strokeWidth={1.8}
                      className="ml-2 shrink-0 text-[#8c929d]"
                    />

                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search products..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleSearch()
                        }
                      }}
                      className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-[#262626] outline-none placeholder:text-[#9aa0aa]"
                      aria-label="Search products"
                    />

                    {query && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("")
                          inputRef.current?.focus()
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8a8f98] transition-colors hover:bg-[#f0f1f4] hover:text-[#262626]"
                        aria-label="Clear search"
                      >
                        <X size={15} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSearch}
                      className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#171717] px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-black"
                    >
                      Search
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="px-2 pb-1 pt-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#a0a5ae]">
                      Try searching
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        "best phone under ₹15,000",
                        "laptop for coding",
                        "best phone for gaming",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setQuery(suggestion)
                            router.push(
                              `/search?q=${encodeURIComponent(suggestion)}`
                            )
                            setOpen(false)
                          }}
                          className="rounded-full border border-[#e7e8ec] bg-white px-3 py-1.5 text-xs text-[#69707b] transition-colors hover:border-[#d9dbe2] hover:bg-[#f7f7f9] hover:text-[#262626]"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#555b66] transition-colors duration-200 hover:bg-[#f5f6f8] hover:text-[#262626]"
            aria-label="Wishlist"
          >
            <Heart size={19} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </header>
  )
}