"use client"

import SearchBar from "@/features/search/components/SearchBar"

type Props = {
  onSearch: (query: string) => void
}

export default function Hero({ onSearch }: Props) {
  return (
    <section className="w-full py-28 px-4 text-center">

      <div className="max-w-3xl mx-auto">

        {/* Badge */}
        <div className="inline-block mb-4 px-4 py-1 text-sm bg-gray-100 rounded-full text-gray-600">
          AI-powered product search
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold leading-tight">
          Stop comparing. <br />
          <span className="text-gray-500">Start deciding.</span>
        </h1>

        {/* Subtext */}
        <p className="mt-6 text-lg text-gray-600">
          Shopio finds the best product for you based on your needs,
          budget and usage — instantly.
        </p>

        {/* Search */}
        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-xl">
            <SearchBar onSearch={onSearch} />
          </div>
        </div>

      </div>

    </section>
  )
}