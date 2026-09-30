import type { Metadata } from "next"

import Hero from "@/components/Hero"
import Features from "@/components/Features"
import HowItWorks from "@/components/HowItWorks"
import Trust from "@/components/Trust"
import CTA from "@/components/CTA"

export const metadata: Metadata = {
  title:
    "BeforeChoice | AI Product Comparison & Best Buying Decisions",

  description:
    "BeforeChoice (Before Choice) helps you compare products, discover the best options for your needs, and make better buying decisions with AI-powered product intelligence.",

  keywords: [
    "BeforeChoice",
    "Before Choice",
    "BeforeChoice AI",
    "Before Choice AI",
    "AI product comparison",
    "product comparison",
    "compare products",
    "best products",
    "best products to buy",
    "product recommendations",
    "best product recommendations",
    "what should I buy",
    "which product should I buy",
    "what to buy",
    "buying guide",
    "buying decisions",
    "product decision engine",
    "AI shopping assistant",
    "AI buying assistant",
    "product intelligence",
  ],

  alternates: {
    canonical: "https://beforechoice.in/",
  },

  openGraph: {
    type: "website",
    url: "https://beforechoice.in/",
    siteName: "BeforeChoice",
    title:
      "BeforeChoice | AI Product Comparison & Best Buying Decisions",
    description:
      "Compare products, discover the best options for your needs, and make better buying decisions with BeforeChoice.",
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title:
      "BeforeChoice | AI Product Comparison & Best Buying Decisions",
    description:
      "Compare products and find the right option for your needs with BeforeChoice.",
  },
}

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://beforechoice.in/#website",
      name: "BeforeChoice",
      alternateName: "Before Choice",
      url: "https://beforechoice.in/",
      description:
        "AI-powered product intelligence platform that helps people compare products and make better buying decisions.",
      inLanguage: "en-IN",
      publisher: {
        "@id": "https://beforechoice.in/#organization",
      },
    },

    {
      "@type": "Organization",
      "@id": "https://beforechoice.in/#organization",
      name: "BeforeChoice",
      alternateName: "Before Choice",
      url: "https://beforechoice.in/",
      description:
        "BeforeChoice is an AI-powered product intelligence platform for product comparison and buying decisions.",
    },

    {
      "@type": "WebPage",
      "@id": "https://beforechoice.in/#webpage",
      url: "https://beforechoice.in/",
      name:
        "BeforeChoice | AI Product Comparison & Best Buying Decisions",
      description:
        "Compare products, discover the best options for your needs, and make better buying decisions with BeforeChoice.",
      isPartOf: {
        "@id": "https://beforechoice.in/#website",
      },
      about: {
        "@id": "https://beforechoice.in/#organization",
      },
      inLanguage: "en-IN",
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