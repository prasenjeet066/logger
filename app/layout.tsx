import type React from "react"
import type { Metadata } from "next"
import { Raleway, Inconsolata } from "next/font/google" // Import Raleway and Inconsolata
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/components/providers/auth-provider"
import { LanguageProvider } from "@/lib/contexts/language-context" // Assuming this is still needed

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
      className={`${raleway.variable} ${inconsolata.variable}`} // Apply both font variables
    >
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
