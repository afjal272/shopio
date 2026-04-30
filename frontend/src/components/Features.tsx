"use client"

import { motion } from "framer-motion"

export default function Features() {
  const features = [
    {
      title: "Smart Recommendations",
      desc: "AI analyzes your needs and gives the best product instead of endless lists.",
      icon: "🧠",
    },
    {
      title: "No More Comparison",
      desc: "Skip hours of research. Get the best choice instantly.",
      icon: "⚡",
    },
    {
      title: "Budget Aware",
      desc: "Find products that actually fit your budget and use-case.",
      icon: "💰",
    },
  ]

  return (
    <section className="w-full py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            Why Shopio?
          </h2>
          <p className="text-gray-500 mt-3 text-lg">
            Stop guessing. Start deciding.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}   // only lift, no scale
              transition={{ duration: 0.5 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-xl mb-4 text-2xl">
                {f.icon}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {f.title}
              </h3>

              <p className="text-gray-500 text-sm leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}

        </div>

      </div>
    </section>
  )
}