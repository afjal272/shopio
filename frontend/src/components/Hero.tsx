"use client"

import SearchBar from "@/features/search/components/SearchBar"

export default function Hero() {
  return (
    <section className="w-full min-h-[85vh] flex items-center justify-center px-4 bg-gradient-to-b from-white to-gray-50">

      <div className="w-full max-w-3xl mx-auto text-center">

        {/* Badge */}
        <div className="inline-block mb-5 px-4 py-1 text-sm bg-gray-100 rounded-full text-gray-600 border border-gray-200">
          AI-powered product search
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
          <span className="text-black">Stop comparing.</span><br />
          <span className="bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent">
            Start deciding.
          </span>
        </h1>

        {/* Subtext */}
        <p className="mt-5 text-lg text-gray-600 max-w-xl mx-auto">
          Shopio finds the best product for you based on your needs,
          budget and usage — instantly.
        </p>

        {/* Search */}
        <div className="mt-8 w-full max-w-md mx-auto">
          <div className="p-2 bg-white rounded-2xl shadow-lg border border-gray-200">
            <SearchBar />
          </div>

          {/* Hint */}
          <p className="text-xs text-gray-400 mt-3">
            Try: “best phone under 20000 for gaming”
          </p>
        </div>

      </div>

    </section>
  )
}