"use client"

import Link from "next/link"

export default function Header() {
  return (
    <header className="w-full bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* 🔥 LOGO = HOME LINK */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          Shopio
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-black transition">
            Features
          </a>
          <a href="#" className="hover:text-black transition">
            How it works
          </a>
          <a href="#" className="hover:text-black transition">
            Contact
          </a>
        </nav>

        {/* CTA */}
        <button className="bg-black text-white px-4 py-2 rounded-lg">
          Try Now
        </button>

      </div>
    </header>
  )
}