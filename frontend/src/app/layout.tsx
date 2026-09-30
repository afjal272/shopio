import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import Script from "next/script"

import "./globals.css"

import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Toaster } from "sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://beforechoice.in"),

  title: {
    default:
      "BeforeChoice | AI Product Comparison, Best Products & Buying Decisions",
    template: "%s | BeforeChoice",
  },

  description:
    "BeforeChoice (Before Choice) is an AI-powered product intelligence platform that helps you compare products, find the best products for your needs, and make better buying decisions.",

  applicationName: "BeforeChoice",

  authors: [
    {
      name: "BeforeChoice",
      url: "https://beforechoice.in",
    },
  ],

  creator: "BeforeChoice",
  publisher: "BeforeChoice",

  /* ==================================================
     Google AdSense Verification
  ================================================== */
  other: {
    "google-adsense-account": "ca-pub-4880966813939651",
  },

  category: "shopping",

  keywords: [
    "BeforeChoice",
    "Before Choice",
    "BeforeChoice AI",
    "Before Choice AI",
    "BeforeChoice product comparison",
    "Before Choice product comparison",

    "best products",
    "best product",
    "best products to buy",
    "best product to buy",
    "what should I buy",
    "which product should I buy",
    "what to buy",
    "product comparison",
    "compare products",
    "product recommendations",
    "best product recommendations",
    "buying guide",
    "buying decision",
    "buying decisions",
    "better buying decisions",
    "product decision engine",
    "AI product comparison",
    "AI shopping assistant",
    "AI buying assistant",
    "product intelligence",

    "best phone",
    "best phones",
    "best smartphone",
    "best smartphones",
    "best mobile phone",
    "best mobile",
    "best phone in India",
    "best phones in India",
    "best smartphone in India",
    "best smartphones in India",
    "best phone to buy",
    "best smartphone to buy",
    "which phone should I buy",
    "which smartphone should I buy",
    "phone comparison",
    "smartphone comparison",
    "mobile comparison",

    "best phone under 10000",
    "best phone under 15000",
    "best phone under 20000",
    "best phone under 25000",
    "best phone under 30000",
    "best phone under 40000",
    "best phone under 50000",
    "best smartphone under 10000",
    "best smartphone under 15000",
    "best smartphone under 20000",
    "best smartphone under 25000",
    "best smartphone under 30000",
    "best smartphone under 40000",
    "best smartphone under 50000",

    "best gaming phone",
    "best gaming phones",
    "best phone for gaming",
    "best phones for gaming",
    "best gaming smartphone",
    "best gaming smartphone in India",
    "best gaming phone under 10000",
    "best gaming phone under 15000",
    "best gaming phone under 20000",
    "best gaming phone under 25000",
    "best gaming phone under 30000",
    "best gaming phone under 40000",
    "best gaming phone under 50000",

    "best camera phone",
    "best camera phones",
    "best camera smartphone",
    "best camera smartphones",
    "best phone for photography",
    "best smartphone for photography",
    "best phone for video",
    "best smartphone for video",
    "best camera phone under 15000",
    "best camera phone under 20000",
    "best camera phone under 25000",
    "best camera phone under 30000",
    "best camera phone under 50000",

    "best battery phone",
    "best battery phones",
    "best phone for battery life",
    "best smartphone for battery life",
    "best battery smartphone",
    "best phone with good battery",
    "best phone with long battery life",

    "best performance phone",
    "best performance smartphone",
    "best phone for performance",
    "best smartphone for performance",
    "best phone for multitasking",
    "best smartphone for multitasking",
    "best processor phone",
    "best processor smartphone",
    "best Snapdragon phone",
    "best Android phone",

    "best AMOLED phone",
    "best AMOLED smartphone",
    "best OLED phone",
    "best OLED smartphone",
    "best 120Hz phone",
    "best 120Hz smartphone",
    "best display phone",
    "best phone with good display",

    "best fast charging phone",
    "best fast charging smartphone",
    "best 5G phone",
    "best 5G smartphone",

    "best phone for students",
    "best smartphone for students",
    "best phone for college students",
    "best phone for work",
    "best smartphone for work",
    "best phone for business",
    "best smartphone for business",
    "best phone for daily use",
    "best smartphone for daily use",
    "best phone for content creation",
    "best smartphone for content creation",
    "best phone for creators",
    "best smartphone for creators",
    "best phone for AI",
    "best smartphone for AI",
    "best phone for long term use",
    "best smartphone for long term use",
    "best compact phone",
    "best compact smartphone",
    "best large screen phone",

    "iPhone comparison",
    "Samsung comparison",
    "Pixel comparison",
    "iPhone vs Samsung",
    "iPhone vs Pixel",
    "Samsung vs Pixel",
    "phone comparison",
    "smartphone comparison",
    "which phone is better",
    "which smartphone is better",
    "which is better iPhone or Samsung",
    "which phone should I buy",
    "phone A vs phone B",
    "smartphone A vs smartphone B",
  ],

  alternates: {
    canonical: "https://beforechoice.in/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    type: "website",
    url: "https://beforechoice.in/",
    siteName: "BeforeChoice",
    title:
      "BeforeChoice | AI Product Comparison, Best Products & Buying Decisions",
    description:
      "BeforeChoice (Before Choice) helps you compare products, discover the best options for your needs, and make better buying decisions.",
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title:
      "BeforeChoice | AI Product Comparison, Best Products & Buying Decisions",
    description:
      "BeforeChoice (Before Choice) helps you compare products and find the right product for your needs.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#fafafc] font-sans text-[#262626]">
        <Header />

        <main className="min-h-0 flex-1">
          {children}
        </main>

        <Footer />

        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            className: "font-sans",
          }}
        />

        {/* ==================================================
            Google AdSense
        ================================================== */}

        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4880966813939651"
          strategy="beforeInteractive"
          crossOrigin="anonymous"
        />

        {/* ==================================================
            Google Analytics 4
        ================================================== */}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Q3JQ2RWYDF"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}

            gtag('js', new Date());
            gtag('config', 'G-Q3JQ2RWYDF');
          `}
        </Script>
      </body>
    </html>
  )
}