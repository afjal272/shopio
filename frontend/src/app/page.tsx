import Hero from "@/components/Hero"
import Features from "@/components/Features"
import HowItWorks from "@/components/HowItWorks"
import Trust from "@/components/Trust"
import CTA from "@/components/CTA"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Features />
      <HowItWorks />
      <Trust />
      <CTA />
    </div>
  )
}