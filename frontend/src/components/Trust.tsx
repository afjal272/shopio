"use client"

import { motion } from "framer-motion"
import { BadgeCheck, ShieldCheck, Zap } from "lucide-react"

export default function Trust() {
  const items = [
    {
      number: "01",
      title: "No Bias",
      desc: "We don’t push sponsored products. Only what fits your needs.",
      icon: ShieldCheck,
    },
    {
      number: "02",
      title: "Fast Decisions",
      desc: "Skip hours of research and get instant recommendations.",
      icon: Zap,
    },
    {
      number: "03",
      title: "Verified Picks",
      desc: "Every suggestion is filtered for quality and relevance.",
      icon: BadgeCheck,
    },
  ]

  return (
    <section
      id="trust"
      className="scroll-mt-24 overflow-hidden bg-[#111217] px-4 py-28 text-white sm:px-6 lg:px-8 lg:py-36"
    >
      <div className="mx-auto max-w-7xl">
        {/* Intro */}
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
              Built for better decisions
            </span>

            <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-[4.3rem]">
              More clarity.
              <br />
              <span className="text-white/40">Less noise.</span>
            </h2>
          </div>

          <p className="max-w-xl text-base leading-7 text-white/50 sm:ml-auto sm:text-lg sm:leading-8">
            Product decisions are already complicated enough. Shopio is built
            to keep the experience focused on what actually helps you choose.
          </p>
        </div>

        {/* Principles */}
        <div className="mt-20 border-y border-white/10">
          {items.map((item, index) => {
            const Icon = item.icon

            return (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                  ease: "easeOut",
                }}
                className="group grid gap-6 border-b border-white/10 py-9 last:border-b-0 sm:grid-cols-[80px_1fr_auto] sm:items-center sm:gap-8 lg:grid-cols-[100px_1fr_auto] lg:py-11"
              >
                {/* Number */}
                <span className="text-xs font-semibold tracking-[0.16em] text-white/25">
                  {item.number}
                </span>

                {/* Main content */}
                <div className="flex items-start gap-5 sm:items-center sm:gap-7">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-indigo-300 transition-all duration-300 group-hover:border-indigo-300/20 group-hover:bg-indigo-300/10">
                    <Icon
                      size={21}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">
                      {item.title}
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Right indicator */}
                <div className="hidden items-center gap-2 text-xs font-medium text-white/30 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                  Designed around your needs
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mt-16 max-w-4xl"
        >
          <p className="text-xl font-medium leading-8 tracking-[-0.02em] text-white/75 sm:text-2xl lg:text-3xl lg:leading-10">
            The goal is not to make shopping feel more complicated.
            <span className="text-white/35">
              {" "}
              It is to make the decision easier to understand.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}