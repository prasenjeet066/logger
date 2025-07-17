import type React from "react"
import type { Metadata } from "next"
import { Raleway, Inconsolata, Besley as Bytesized } from "next/font/google" // Import Raleway, Inconsolata, and Bytesized
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/components/providers/auth-provider"
import { LanguageProvider } from "@/lib/contexts/language-context"

// Configure Raleway font
const raleway = Raleway({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-raleway", // Define CSS variable for Raleway
})

// Configure Inconsolata font
const inconsolata = Inconsolata({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inconsolata", // Define CSS variable for Inconsolata
})

// Configure Bytesized font for the logo
const bytesized = Bytesized({
  weight: "400", // Bytesized is a single-weight font, so specify a weight
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bytesized", // Define CSS variable for Bytesized
})

export const metadata: Metadata = {
  title: "Microblog - Share Your Thoughts",
  description: "A modern microblogging platform built with Next.js",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${raleway.variable} ${inconsolata.variable} ${bytesized.variable}`} // Apply all font variables
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap"
          rel="stylesheet"
        />
        <link href="https://fonts.googleapis.com/css2?family=Bytesized&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap" rel="stylesheet"/>
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <LanguageProvider>{children}</LanguageProvider>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
