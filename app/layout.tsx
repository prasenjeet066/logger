import type React from "react"
import type { Metadata } from "next"
import { Raleway, Inconsolata, Besley as Bytesized } from "next/font/google" // Import Raleway, Inconsolata, and Bytesized
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/components/providers/auth-provider"
import { LanguageProvider } from "@/lib/contexts/language-context"
import localFont from 'next/font/local'
// Configure Raleway font
const pallyFont = localFont({
  src: [
    {
      path: '/fonts/WEB/fonts/Pally-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    
    {
      path: '/fonts/WEB/fonts/Pally-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    
  ],
  variable : '--pally-font',
  display: 'swap'
})
const logoFont = localFont({
  src: [
    {
      path: '/fonts/Nippo_Complete/Fonts/WEB/fonts/Nippo-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    
    {
      path: '/fonts/Nippo_Complete/Fonts/WEB/fonts/Nippo-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    
  ],
  variable : '--logo-font',
  display: 'swap'
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
      className={pallyFont.className} // Apply all font variables
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap"
          rel="stylesheet"
        />
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
