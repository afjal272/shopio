"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Heart, X } from "lucide-react"

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
    <header className="w-full bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          Shopio
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-black transition">Features</a>
          <a href="#" className="hover:text-black transition">How it works</a>
          <a href="#" className="hover:text-black transition">Contact</a>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="flex items-center">
            {open ? (
              <div className="flex items-center border rounded-lg overflow-hidden">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="px-3 py-1.5 text-sm w-40 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  className="bg-black text-white px-3 py-1.5 text-sm"
                >
                  Go
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="px-2 text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <Search size={18} />
              </button>
            )}
          </div>

          {/* ✅ CLEAN WISHLIST */}
          <Link
            href="/wishlist"
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Heart size={18} />
          </Link>

          {/* Login */}
          <Link
            href="/login"
            className="bg-black text-white px-4 py-2 rounded-lg text-sm"
          >
            Login
          </Link>

        </div>
      </div>
    </header>
  )
}