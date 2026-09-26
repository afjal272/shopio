"use client"

import { motion } from "framer-motion"
import {
  Brain,
  CircleDollarSign,
  GitCompareArrows,
  Sparkles,
  Zap,
} from "lucide-react"

export default function Features() {
  const features = [
    {
      number: "01",
      title: "Smart Recommendations",
      desc: "AI analyzes your needs and gives the best product instead of endless lists.",
      icon: Brain,
    },
    {
      number: "02",
      title: "No More Comparison",
      desc: "Skip hours of research and get the best choice instantly.",
      icon: Zap,
    },
    {
      number: "03",
      title: "Budget Aware",
      desc: "Find products that actually fit your budget and use-case.",
      icon: CircleDollarSign,
    },
  ]

  return (
    <section
      id="features"
      className="relative scroll-mt-24 overflow-hidden bg-white px-4 py-28 sm:px-6 lg:px-8 lg:py-36"
    >
      <div className="mx-auto max-w-7xl">
        {/* Top intro */}
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8f98]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5b5ce2]" />
              Why BeforeChoice
            </span>

            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#262626] sm:text-5xl lg:text-[4.3rem]">
              A better way
              <br />
              <span className="text-[#858a93]">to choose.</span>
            </h2>
          </div>

          <div className="max-w-xl lg:ml-auto">
            <p className="text-base leading-7 text-[#656b76] sm:text-lg sm:leading-8">
              Product search should not end with another hundred tabs.
              BeforeChoice turns your requirements into a clearer path to the
              product that fits.
            </p>
          </div>
        </div>

        {/* Main visual area */}
        <div className="mt-20 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Left visual */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative min-h-105 overflow-hidden rounded-[30px] bg-[#111217] p-7 text-white sm:p-9 lg:min-h-125"
          >
            {/* Background glow */}
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-white/3 blur-3xl"
            />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/40">
                    Decision engine
                  </span>

                  <Sparkles
                    size={18}
                    strokeWidth={1.6}
                    className="text-indigo-300"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-8 max-w-sm text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
                  Search less.
                  <br />
                  Understand more.
                </h3>

                <p className="mt-5 max-w-sm text-sm leading-7 text-white/50 sm:text-base">
                  BeforeChoice considers your budget, preferences and use-case before
                  narrowing the options down.
                </p>
              </div>

              {/* Mini decision visual */}
              <div className="relative mt-12">
                <div className="rounded-2xl border border-white/10 bg-white/4.5 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/45">
                      Your priorities
                    </span>

                    <span className="text-xs text-indigo-300">
                      Personalized
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white/5 p-3">
                      <Zap
                        size={15}
                        className="text-indigo-300"
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />

                      <p className="mt-2 text-[11px] text-white/45">
                        Performance
                      </p>

                      <p className="mt-1 text-sm font-medium text-white/85">
                        High
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 p-3">
                      <CircleDollarSign
                        size={15}
                        className="text-emerald-300"
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />

                      <p className="mt-2 text-[11px] text-white/45">
                        Budget
                      </p>

                      <p className="mt-1 text-sm font-medium text-white/85">
                        ₹30K
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 p-3">
                      <Brain
                        size={15}
                        className="text-indigo-300"
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />

                      <p className="mt-2 text-[11px] text-white/45">
                        Use-case
                      </p>

                      <p className="mt-1 text-sm font-medium text-white/85">
                        Gaming
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right feature list */}
          <div className="rounded-[30px] border border-[#e7e9ee] bg-[#fafafc] px-6 sm:px-8 lg:px-10">
            {features.map((feature, index) => {
              const Icon = feature.icon

              return (
                <motion.div
                  key={feature.number}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                    ease: "easeOut",
                  }}
                  className="group border-b border-[#e5e7eb] py-9 last:border-b-0 sm:py-11"
                >
                  <div className="flex items-start gap-5 sm:gap-7">
                    <span className="pt-1 text-xs font-semibold tracking-[0.14em] text-[#a0a5ae]">
                      {feature.number}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <h3 className="text-2xl font-semibold tracking-[-0.025em] text-[#262626] sm:text-[1.7rem]">
                            {feature.title}
                          </h3>

                          <p className="mt-3 max-w-xl text-sm leading-7 text-[#656b76] sm:text-base">
                            {feature.desc}
                          </p>
                        </div>

                        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e1e3e8] bg-white text-[#5b5ce2] shadow-sm transition-all duration-300 group-hover:border-[#d8d9f5] group-hover:bg-[#f3f3ff] sm:flex">
                          <Icon
                            size={19}
                            strokeWidth={1.7}
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[#8a8f98]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#5b5ce2] opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
                        Built around your decision
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Bottom statement */}
        <div className="mt-16 flex flex-col gap-5 border-t border-[#e7e9ee] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xl font-medium leading-8 tracking-[-0.02em] text-[#454a53] sm:text-2xl">
            The goal is not to show you more products.
            <span className="text-[#8a8f98]">
              {" "}
              It&apos;s to help you choose between them.
            </span>
          </p>

          <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#5b5ce2]">
            <GitCompareArrows size={17} strokeWidth={1.7} aria-hidden="true" />
            Compare with context
          </div>
        </div>
      </div>
    </section>
  )
}