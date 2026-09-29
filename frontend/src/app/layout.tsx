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
    default: "BeforeChoice",
    template: "%s | BeforeChoice",
  },

  description:
    "BeforeChoice is an AI-powered product intelligence platform that helps you compare products and make better buying decisions.",

  applicationName: "BeforeChoice",

  authors: [
    {
      name: "BeforeChoice",
      url: "https://beforechoice.in",
    },
  ],

  creator: "BeforeChoice",
  publisher: "BeforeChoice",

  keywords: [
    "BeforeChoice",
    "AI product comparison",
    "product intelligence",
    "product recommendations",
    "buying decisions",
    "compare products",
    "AI shopping assistant",
  ],

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

  openGraph: {
    type: "website",
    url: "https://beforechoice.in",
    siteName: "BeforeChoice",
    title: "BeforeChoice",
    description:
      "AI-powered product intelligence that helps you compare products and make better buying decisions.",
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title: "BeforeChoice",
    description:
      "AI-powered product intelligence that helps you compare products and make better buying decisions.",
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