"use client"

import { motion } from "framer-motion"
import {
  ArrowRight,
  MessageSquareText,
  Sparkles,
  Target,
} from "lucide-react"

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Tell us what you need",
      desc: "Describe your requirement, budget, or use-case in plain language.",
      icon: MessageSquareText,
    },
    {
      number: "02",
      title: "AI analyzes options",
      desc: "Shopio evaluates available products and compares the details that matter.",
      icon: Sparkles,
    },
    {
      number: "03",
      title: "Get the best pick",
      desc: "Receive a clear recommendation tailored to your requirements.",
      icon: Target,
    },
  ]

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 overflow-hidden bg-[#f4f5f8] px-4 py-28 sm:px-6 lg:px-8 lg:py-36"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8f98]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5b5ce2]" />
              How it works
            </span>

            <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#262626] sm:text-5xl lg:text-[4.2rem]">
              From a question
              <br />
              <span className="text-[#858a93]">to a decision.</span>
            </h2>
          </div>

          <p className="max-w-xl text-base leading-7 text-[#656b76] sm:ml-auto sm:text-lg sm:leading-8">
            Simple steps. Clear reasoning. A recommendation built around what
            you actually need.
          </p>
        </div>

        {/* Workflow */}
        <div className="mt-20 overflow-hidden rounded-[30px] border border-[#dfe2e8] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
          <div className="grid lg:grid-cols-[0.38fr_1fr]">
            {/* Left visual rail */}
            <div className="relative overflow-hidden border-b border-[#e8eaf0] bg-[#111217] p-8 text-white sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
              <div
                aria-hidden="true"
                className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl"
              />

              <div
                aria-hidden="true"
                className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"
              />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                    The decision flow
                  </p>

                  <p className="mt-8 max-w-xs text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
                    Less searching.
                    <br />
                    More certainty.
                  </p>

                  <p className="mt-5 max-w-xs text-sm leading-7 text-white/50">
                    Shopio turns a natural-language request into a focused
                    product decision.
                  </p>
                </div>

                <div className="mt-12">
                  <div className="text-6xl font-semibold tracking-[-0.06em] text-white/10 sm:text-7xl">
                    01
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-white/45">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                    Ask → understand → decide
                  </div>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="relative px-6 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
              <div
                aria-hidden="true"
                className="absolute bottom-16 left-[42px] top-16 w-px bg-[#e3e6eb] sm:left-[56px] lg:left-[68px]"
              />

              <div className="relative">
                {steps.map((step, index) => {
                  const Icon = step.icon

                  return (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, x: 18 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{
                        duration: 0.45,
                        delay: index * 0.1,
                        ease: "easeOut",
                      }}
                      className="group relative flex gap-5 py-7 first:pt-2 last:pb-2 sm:gap-7 lg:gap-9 lg:py-9"
                    >
                      {/* Number / icon */}
                      <div className="relative z-10 shrink-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e0e3e9] bg-white text-[#5b5ce2] shadow-sm transition-all duration-300 group-hover:border-[#d8d9f5] group-hover:bg-[#f3f3ff] sm:h-14 sm:w-14">
                          <Icon
                            size={20}
                            strokeWidth={1.7}
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-semibold tracking-[0.14em] text-[#a0a5ae]">
                            {step.number}
                          </span>

                          {index < steps.length - 1 && (
                            <span className="hidden items-center gap-1 text-xs text-[#a0a5ae] sm:inline-flex">
                              Next
                              <ArrowRight size={12} aria-hidden="true" />
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#262626] sm:text-3xl">
                          {step.title}
                        </h3>

                        <p className="mt-3 max-w-xl text-sm leading-7 text-[#656b76] sm:text-base">
                          {step.desc}
                        </p>

                        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-[#8a8f98]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#5b5ce2]" />
                          Built around your requirements
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom insight strip */}
          <div className="border-t border-[#e8eaf0] bg-[#fafafc] px-6 py-5 sm:px-8 lg:px-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-[#454a53]">
                A recommendation should explain the decision, not just give a
                score.
              </p>

              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#5b5ce2]">
                <Sparkles size={14} aria-hidden="true" />
                Clear reasoning
              </div>
            </div>
          </div>
        </div>

        {/* Supporting statement */}
        <div className="mt-14 flex flex-col gap-4 border-t border-[#dfe2e8] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-xl font-medium leading-8 tracking-[-0.02em] text-[#454a53] sm:text-2xl">
            Less research. More confident decisions.
          </p>

          <p className="text-sm text-[#8a8f98]">
            Search → Understand → Choose
          </p>
        </div>
      </div>
    </section>
  )
}