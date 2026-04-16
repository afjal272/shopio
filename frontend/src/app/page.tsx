import Hero from "@/components/Hero"
import Features from "@/components/Features"
import HowItWorks from "@/components/HowItWorks"
import Trust from "@/components/Trust"
import CTA from "@/components/CTA"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* HERO */}
      <Hero />

      {/* FEATURES */}
      <Features />

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* TRUST */}
      <Trust />

      {/* CTA */}
      <CTA />

    </main>
  )
}