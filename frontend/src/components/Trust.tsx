"use client"

import { motion } from "framer-motion"
import { ShieldCheck, Zap, BadgeCheck } from "lucide-react"

export default function Trust() {
  const items = [
    {
      title: "No Bias",
      desc: "We don’t push sponsored products. Only what fits your needs.",
      icon: ShieldCheck,
    },
    {
      title: "Fast Decisions",
      desc: "Skip hours of research and get instant recommendations.",
      icon: Zap,
    },
    {
      title: "Verified Picks",
      desc: "Every suggestion is filtered for quality and relevance.",
      icon: BadgeCheck,
    },
  ]

  return (
    <section className="w-full py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            Why Trust Shopio
          </h2>
          <p className="text-gray-500 mt-3 text-lg">
            Built for clarity, not confusion.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-10">

          {items.map((item, i) => {
            const Icon = item.icon

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex gap-4 items-start"
              >
                {/* Icon */}
                <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
                  <Icon className="w-5 h-5 text-gray-700" />
                </div>

                {/* Text */}
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {item.title}
                  </h4>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}

        </div>

      </div>
    </section>
  )
}