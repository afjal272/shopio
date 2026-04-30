"use client"

import { motion } from "framer-motion"

export default function Hero() {
  return (
    <section className="relative w-full min-h-[85vh] flex items-center justify-center px-4 overflow-hidden bg-white">

      {/* 🔥 Background glow */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 opacity-20 blur-3xl" />

      <div className="w-full max-w-3xl mx-auto text-center">

        {/* Badge */}
        <div className="inline-block mb-6 px-4 py-1 text-sm bg-gray-100 rounded-full text-gray-600 border border-gray-200">
          AI-powered product search
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
          <span className="text-gray-900">Stop comparing.</span><br />
          <span className="text-gray-400">Start deciding.</span>
        </h1>

        {/* Subtext */}
        <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto">
          Shopio finds the best product for you based on your needs,
          budget and usage — instantly.
        </p>

        {/* 🔍 Search (Marvin style pill) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 w-full max-w-xl mx-auto"
        >
          <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-md px-2 py-2 focus-within:ring-2 focus-within:ring-black/10">

            {/* Input */}
            <input
              type="text"
              placeholder="e.g. best phone under 20000 for gaming"
              className="flex-1 px-4 py-3 bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
            />

            {/* Button */}
            <button className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition">
              Search
            </button>

          </div>

          {/* Hint */}
          <p className="text-xs text-gray-400 mt-3">
            Try: “best phone under 20000 for gaming”
          </p>
        </motion.div>

      </div>

    </section>
  )
}