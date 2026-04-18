"use client"

import SearchBar from "@/features/search/components/SearchBar"

export default function Hero() {
  return (
    <section className="w-full min-h-[85vh] flex items-center justify-center px-4 bg-white">

      <div className="w-full max-w-3xl mx-auto text-center">

        {/* Badge */}
        <div className="inline-block mb-5 px-4 py-1 text-sm bg-gray-100 rounded-full text-gray-600">
          AI-powered product search
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight text-black">
          Stop comparing. <br />
          <span className="text-gray-400">Start deciding.</span>
        </h1>

        {/* Subtext */}
        <p className="mt-5 text-lg text-gray-600 max-w-xl mx-auto">
          Shopio finds the best product for you based on your needs,
          budget and usage — instantly.
        </p>

        {/* Search */}
        <div className="mt-8 w-full max-w-md mx-auto">
          <SearchBar />
        </div>

      </div>

    </section>
  )
}