import Link from "next/link"
import { ArrowUpRight, Sparkles } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full bg-[#111217] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="grid gap-14 py-16 sm:py-20 lg:grid-cols-[1.15fr_0.85fr_0.85fr_1.1fr] lg:gap-12 lg:py-24">
          {/* Brand */}
          <div className="max-w-md">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xl font-semibold tracking-[-0.04em] text-white transition-opacity hover:opacity-75"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5b5ce2]">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>

              BeforeChoice
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/50 sm:text-base">
              AI-powered product intelligence that helps you spend less time
              comparing and more time making the right decision.
            </p>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/55">
              <Sparkles
                size={13}
                className="text-indigo-300"
                aria-hidden="true"
              />
              Search less. Decide better.
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
              Product
            </h3>

            <ul className="mt-6 space-y-3.5 text-sm text-white/55">
              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-white"
                >
                  Search
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-white"
                >
                  Recommendations
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-white"
                >
                  AI Engine
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
              Company
            </h3>

            <ul className="mt-6 space-y-3.5 text-sm text-white/55">
              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-white"
                >
                  About
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-white"
                >
                  Contact us
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="transition-colors hover:text-white"
                >
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
              Stay in the loop
            </h3>

            <p className="mt-6 max-w-sm text-sm leading-6 text-white/50">
              Get product updates, decision-making insights, and new BeforeChoice
              features.
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  aria-label="Email address"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                />

                <button
                  type="button"
                  className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#171717] transition-all duration-200 hover:bg-[#f1f1f3]"
                >
                  Join
                  <ArrowUpRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} BeforeChoice. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <a
              href="#"
              className="transition-colors hover:text-white/70"
            >
              Privacy
            </a>

            <a
              href="#"
              className="transition-colors hover:text-white/70"
            >
              Terms
            </a>

            <a
              href="#"
              className="transition-colors hover:text-white/70"
            >
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}