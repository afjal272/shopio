"use client"

import { motion } from "framer-motion"

export default function HowItWorks() {
  const steps = [
    {
      title: "Tell us what you need",
      desc: "Describe your requirement, budget, or use-case.",
    },
    {
      title: "AI analyzes options",
      desc: "We scan and compare products intelligently.",
    },
    {
      title: "Get the best pick",
      desc: "Receive a single, optimized recommendation instantly.",
    },
  ]

  return (
    <section className="w-full py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            How it works
          </h2>
          <p className="text-gray-500 mt-3 text-lg">
            Simple steps. Smart results.
          </p>
        </div>

        {/* Steps */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.2 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-md transition"
            >
              {/* Step label */}
              <span className="text-sm text-gray-400 font-medium">
                Step {i + 1}
              </span>

              <h3 className="text-lg font-semibold text-gray-900 mt-2">
                {step.title}
              </h3>

              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}