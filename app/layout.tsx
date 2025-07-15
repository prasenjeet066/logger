import type React from "react"
import type { Metadata } from "next"
// import { Inter } from 'next/font/google' // Removed Inter import
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from "@/lib/contexts/language-context" // Ensure LanguageProvider is imported

// const inter = Inter({ subsets: ["latin"] }) // Removed Inter instance

export const metadata: Metadata = {
  title: "Codes - Social Media Platform",
  description: "A modern social media platform built with Next.js",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {" "}
        {/* Removed className={inter.className} */}
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <LanguageProvider>
              {" "}
              {/* Wrapped children with LanguageProvider */}
              {children}
            </LanguageProvider>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
