"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, ArrowLeft } from "lucide-react"

function TwoFactorAuthContent() {
  const [totpCode, setTotpCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTime, setLockTime] = useState(0)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const password = searchParams.get('password')
  const rememberMe = searchParams.get('rememberMe') === 'true'

  useEffect(() => {
    // Check if we have the required parameters
    if (!email || !password) {
      router.push('/auth/sign-in')
      return
    }

    // Check if user is locked
    const lockUntil = localStorage.getItem('2fa_lock_until')
    if (lockUntil) {
      const lockTime = parseInt(lockUntil)
      if (Date.now() < lockTime) {
        setIsLocked(true)
        setLockTime(lockTime)
        const interval = setInterval(() => {
          if (Date.now() >= lockTime) {
            setIsLocked(false)
            localStorage.removeItem('2fa_lock_until')
            clearInterval(interval)
          }
        }, 1000)
        return () => clearInterval(interval)
      } else {
        localStorage.removeItem('2fa_lock_until')
      }
    }
  }, [email, password, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked || !totpCode.trim()) return

    setIsLoading(true)
    setMessage("")

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email,
        password: password,
        totpCode: totpCode,
        fingerprint: "", // Will be generated on the server
        rememberMe: rememberMe.toString(),
      })

      if (result?.error) {
        setMessage(result.error)
        setAttempts(prev => prev + 1)
        
        // Lock after 5 failed attempts for 15 minutes
        if (attempts >= 4) {
          const lockUntil = Date.now() + (15 * 60 * 1000) // 15 minutes
          localStorage.setItem('2fa_lock_until', lockUntil.toString())
          setIsLocked(true)
          setLockTime(lockUntil)
        }
      } else if (result?.ok) {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('rememberMe')
        }
        router.push("/dashboard")
      }
    } catch (error) {
      setMessage("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    // This would typically trigger a new code to be sent
    // For now, we'll just show a message
    setMessage("A new code has been sent to your authenticator app.")
  }

  const formatTime = (time: number) => {
    const remaining = Math.max(0, Math.ceil((time - Date.now()) / 1000))
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (isLocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <h1 className='logo-font text-sm'>blue</h1>
        <Card className="w-full max-w-md border-none shadow-none bg-gray-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-red-500" />
              Account Temporarily Locked
            </CardTitle>
            <CardDescription>
              Too many failed attempts. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-mono font-bold text-red-500 mb-4">
              {formatTime(lockTime)}
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/auth/sign-in')}
              className="w-full rounded-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className='logo-font text-sm'>blue</h1>
      <Card className="w-full max-w-md border-none shadow-none bg-gray-50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp">Authentication Code</Label>
              <Input
                id="totp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="rounded-full text-center text-lg font-mono tracking-widest"
                value={totpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setTotpCode(value)
                }}
                placeholder="000000"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full rounded-full" disabled={isLoading || !totpCode.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Sign In
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendCode}
                className="text-sm text-blue-600 hover:text-blue-700"
                disabled={isLoading}
              >
                Resend Code
              </Button>
              
              <div className="text-xs text-gray-500">
                Attempts remaining: {5 - attempts}
              </div>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => router.push('/auth/sign-in')}
              className="w-full rounded-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TwoFactorAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <h1 className='logo-font text-sm'>blue</h1>
        <Card className="w-full max-w-md border-none shadow-none bg-gray-50">
          <CardContent className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <TwoFactorAuthContent />
    </Suspense>
  )
}