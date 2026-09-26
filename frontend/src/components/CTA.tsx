"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Search, Sparkles } from "lucide-react"

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-[#fafafc] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-indigo-100/35 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-px w-[85%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#dfe2e8] to-transparent"
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[32px] border border-[#e2e4ea] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left */}
            <div className="relative px-7 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45 }}
              >
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8f98]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5b5ce2]" />
                  Make the decision
                </div>

                <h2 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#262626] sm:text-5xl lg:text-[4.4rem]">
                  Stop opening tabs.
                  <br />
                  <span className="text-[#858a93]">
                    Start choosing.
                  </span>
                </h2>

                <p className="mt-6 max-w-xl text-base leading-7 text-[#656b76] sm:text-lg sm:leading-8">
                  Tell Shopio what you are looking for and let it turn the
                  research into a clearer product decision.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/search"
                    className="group inline-flex items-center gap-2 rounded-xl bg-[#171717] px-5 py-3.5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition-all duration-200 hover:bg-black hover:shadow-[0_14px_30px_rgba(15,23,42,0.16)]"
                  >
                    Try Shopio

                    <ArrowRight
                      size={16}
                      strokeWidth={1.9}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>

                  <span className="text-sm text-[#969ca6]">
                    No complicated setup
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Right visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="relative overflow-hidden border-t border-[#e8eaf0] bg-[#f7f7fa] px-6 py-8 sm:px-8 sm:py-10 lg:border-l lg:border-t-0 lg:px-10 lg:py-12"
            >
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-100/50 blur-3xl"
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9aa0aa]">
                      Ask Shopio
                    </p>

                    <p className="mt-1 text-sm font-medium text-[#454a53]">
                      Start with a simple question
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eeeeff] text-[#5b5ce2]">
                    <Sparkles size={16} aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-7 rounded-[22px] border border-[#e2e4ea] bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center gap-3 rounded-[16px] border border-[#e7e9ee] px-4 py-3.5">
                    <Search
                      size={18}
                      className="shrink-0 text-[#8a8f98]"
                      aria-hidden="true"
                    />

                    <span className="truncate text-sm text-[#656b76]">
                      best phone under ₹30,000 for gaming
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#e3e5eb] bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a0a5ae]">
                      Budget
                    </p>

                    <p className="mt-2 text-lg font-semibold text-[#262626]">
                      ₹30,000
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e3e5eb] bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a0a5ae]">
                      Priority
                    </p>

                    <p className="mt-2 text-lg font-semibold text-[#262626]">
                      Gaming
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[#dfe1f4] bg-gradient-to-br from-[#f5f5ff] to-white p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d82d8]">
                        Shopio result
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#34363b]">
                        Recommendation matched
                      </p>
                    </div>

                    <span className="rounded-full bg-[#ececff] px-2.5 py-1 text-xs font-semibold text-[#5b5ce2]">
                      94 / 100
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-[#656b76]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Based on your priorities
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-7 flex flex-col gap-2 px-1 text-xs text-[#969ca6] sm:flex-row sm:items-center sm:justify-between">
          <span>Search less. Decide with more context.</span>
          <span>Shopio AI</span>
        </div>
      </div>
    </section>
  )
}