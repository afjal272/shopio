"use client"

import { motion } from "framer-motion"

export default function CTA() {
  return (
    <section className="w-full py-24 bg-black text-white text-center">
      <div className="max-w-3xl mx-auto px-4">

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold tracking-tight"
        >
          Stop wasting time comparing products.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-gray-300 text-lg"
        >
          Let AI instantly find the best option for you.
        </motion.p>

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="mt-8 bg-white text-black px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition"
        >
          Try Shopio Now
        </motion.button>

      </div>
    </section>
  )
}