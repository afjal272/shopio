"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, Check, Sparkles } from "lucide-react"

import SearchBar from "@/features/search/components/SearchBar"

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#fafafc] px-4 sm:px-6 lg:px-8">
      {/* Soft background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-240px] h-[540px] w-[760px] -translate-x-1/2 rounded-full bg-indigo-100/30 blur-3xl"
      />

      <div className="relative mx-auto grid min-h-[78vh] max-w-6xl items-center gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-2xl"
        >
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e4e6eb] bg-white px-3.5 py-2 text-xs font-medium text-[#707681] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5b5ce2]" />
            AI-powered product intelligence
          </div>

          {/* Heading */}
          <h1 className="text-[3.4rem] font-semibold leading-[1] tracking-[-0.05em] text-[#262626] sm:text-5xl lg:text-[4.7rem]">
            Stop comparing.
            <br />
            <span className="text-[#727780]">Start deciding.</span>
          </h1>

          {/* Description */}
          <p className="mt-7 max-w-xl text-base leading-7 text-[#656b76] sm:text-lg">
            Tell BeforeChoice what you need. We compare the products and help you
            understand which one actually fits.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl">
            <div className="rounded-[20px] border border-[#e2e4ea] bg-white p-2 shadow-[0_14px_40px_rgba(15,23,42,0.07)]">
              <SearchBar />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#8a8f98]">
              <span>Try:</span>

              <span className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5">
                best phone under ₹30,000
              </span>

              <span className="hidden rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 sm:inline-flex">
                laptop for coding
              </span>
            </div>
          </div>

          {/* Trust line */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#8a8f98] sm:text-sm">
            <span className="flex items-center gap-2">
              <Check size={14} className="text-emerald-500" />
              Real specifications
            </span>

            <span className="hidden h-4 w-px bg-[#dfe2e8] sm:block" />

            <span className="flex items-center gap-2">
              <Check size={14} className="text-[#5b5ce2]" />
              Preference-based ranking
            </span>
          </div>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-[520px] lg:ml-auto"
        >
          {/* Main preview */}
          <div className="relative overflow-hidden rounded-[28px] border border-[#e4e6eb] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa0aa]">
                  BeforeChoice AI
                </p>

                <p className="mt-1 text-sm font-medium text-[#3f4248]">
                  Your recommendation
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f2ff] text-[#5b5ce2]">
                <Sparkles size={16} />
              </div>
            </div>

            {/* Query */}
            <div className="mt-5 rounded-2xl bg-[#f7f7fa] px-4 py-3">
              <p className="text-[11px] text-[#969ca6]">
                Looking for
              </p>

              <p className="mt-1 text-sm font-medium text-[#3f4248]">
                “Best phone under ₹30,000 for gaming”
              </p>
            </div>

            {/* Recommendation */}
            <div className="mt-4 rounded-2xl border border-[#e5e6f3] bg-gradient-to-br from-[#f7f7ff] via-white to-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ececff] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#5b5ce2]">
                    <Sparkles size={10} />
                    BEST MATCH
                  </span>

                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[#262626]">
                    Best fit for your needs
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-semibold tracking-tight text-[#262626]">
                    94
                  </p>

                  <p className="text-[11px] text-[#8a8f98]">
                    match score
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#656b76]">
                Strong performance, suitable price, and specifications aligned
                with your priorities.
              </p>

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-[#626873]">
                  <Check size={14} className="text-emerald-500" />
                  Strong gaming performance
                </div>

                <div className="flex items-center gap-2 text-xs text-[#626873]">
                  <Check size={14} className="text-emerald-500" />
                  Fits your preferred budget
                </div>

                <div className="flex items-center gap-2 text-xs text-[#626873]">
                  <Check size={14} className="text-emerald-500" />
                  Balanced overall specifications
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#e8e9ed] px-4 py-3">
              <span className="text-xs text-[#8a8f98]">
                Why this product?
              </span>

              <div className="flex items-center gap-1 text-xs font-medium text-[#5b5ce2]">
                View reasoning
                <ArrowUpRight size={13} />
              </div>
            </div>
          </div>

          {/* Small floating note */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-4 -left-4 hidden rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] sm:block"
          >
            <p className="text-[10px] uppercase tracking-wide text-[#9aa0aa]">
              Decision engine
            </p>

            <p className="mt-0.5 text-xs font-medium text-[#454a53]">
              Ranked around your priorities
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#fafafc] to-transparent"
      />
    </section>
  )
}