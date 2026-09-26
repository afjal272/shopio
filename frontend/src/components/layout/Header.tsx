"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Heart, X, ArrowRight } from "lucide-react"

export default function Header() {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  const router = useRouter()

  const handleSearch = () => {
    if (!query.trim()) return

    router.push(`/search?q=${encodeURIComponent(query)}`)
    setOpen(false)
  }

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
          <div className="flex items-center">
            {open ? (
              <div className="flex h-10 items-center overflow-hidden rounded-xl border border-[#dfe2e8] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch()
                    }
                  }}
                  className="w-36 bg-transparent px-3 text-sm text-[#262626] outline-none placeholder:text-[#9aa0aa] sm:w-48"
                />

                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex h-full items-center gap-1.5 bg-[#171717] px-3.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-black"
                >
                  Search
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setQuery("")
                  }}
                  className="px-3 text-[#8a8f98] transition-colors hover:text-[#262626]"
                  aria-label="Close search"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#555b66] transition-colors duration-200 hover:bg-[#f5f6f8] hover:text-[#262626]"
                aria-label="Open search"
              >
                <Search size={19} strokeWidth={1.8} />
              </button>
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

          {/* Login */}
          <Link
            href="/login"
            className="ml-1 inline-flex h-10 items-center justify-center rounded-xl bg-[#171717] px-4 text-sm font-medium text-white transition-all duration-200 hover:bg-black hover:shadow-[0_6px_18px_rgba(15,23,42,0.12)]"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  )
}