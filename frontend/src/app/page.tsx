import Hero from "@/components/Hero"
import Features from "@/components/Features"
import HowItWorks from "@/components/HowItWorks"
import Trust from "@/components/Trust"
import CTA from "@/components/CTA"

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://beforechoice.in/#website",
      name: "BeforeChoice",
      url: "https://beforechoice.in/",
      description:
        "AI-powered product intelligence that helps you compare products and make better buying decisions.",
    },
    {
      "@type": "Organization",
      "@id": "https://beforechoice.in/#organization",
      name: "BeforeChoice",
      url: "https://beforechoice.in/",
    },
  ],
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <script
        id="beforechoice-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <Hero />
      <Features />
      <HowItWorks />
      <Trust />
      <CTA />
    </div>
  )
}