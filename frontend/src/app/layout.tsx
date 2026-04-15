import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Shopio AI",
  description: "AI-powered product decision engine",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">

        {/* HEADER */}
        <Header />

        {/* MAIN CONTENT */}
        <main className="flex-1">
          {children}
        </main>

        {/* FOOTER */}
        <Footer />

      </body>
    </html>
  )
}