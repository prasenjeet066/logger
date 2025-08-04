import type React from "react"
import type { Metadata } from "next"
import { Raleway, Inconsolata, Besley as Bytesized } from "next/font/google" // Import Raleway, Inconsolata, and Bytesized
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/components/providers/auth-provider"
import { LanguageProvider } from "@/lib/contexts/language-context"

export const metadata: Metadata = {
  title: "Microblog - Share Your Thoughts",
  description: "A modern microblogging platform built with Next.js"
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
       >
      <head>
        
        <link href = '/fonts/static/main.css' rel = 'stylesheet'/>
        <link href = '/fonts/Nippo_Complete/Fonts/WEB/css/nippo.css' rel = 'stylesheet'/>
        <link href='/fonts/WEB/css/pally.css' rel='stylesheet'/>
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