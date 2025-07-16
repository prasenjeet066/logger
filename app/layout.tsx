import type React from "react"
import type { Metadata } from "next"
import { Raleway, Inconsolata, Space_Grotesk } from "next/font/google" // Import Raleway, Inconsolata, and Space_Grotesk
import localFont from "next/font/local" // Import localFont for Bytesized
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

// Configure Space Grotesk font
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
})

// Configure Bytesized font (assuming it's a local font or a specific Google Font that needs this approach)
// If 'Bytesized' is a standard Google Font, you would import it like Raleway/Inconsolata.
// For demonstration, I'll treat it as a local font or a custom font that needs a specific import.
// If it's a Google Font, please confirm its exact name for `next/font/google`.
// For now, I'll use a placeholder for a local font, as 'Bytesized' isn't a standard Google Font name.
// If it's a custom font file, you'd use `localFont`. If it's a Google Font, replace `localFont` with `GoogleFontName`.
const bytesized = localFont({
  src: [
    {
      path: "../public/fonts/Bytesized.ttf", // Placeholder path, replace with actual font file if local
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-bytesized",
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
      className={`${raleway.variable} ${inconsolata.variable} ${spaceGrotesk.variable} ${bytesized.variable}`} // Apply all font variables
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
