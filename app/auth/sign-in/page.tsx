"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react" // Import signIn from next-auth/react
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { signInSchema, type SignInData } from "@/lib/validations/auth"
import { Loader2 } from "lucide-react"

export default function SignInPage() {
  const [formData, setFormData] = useState<SignInData>({
    email: "",
    password: "",
    fingerprint: "",
  })
  const [errors, setErrors] = useState<Partial<SignInData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const [state, setState] = useState(0)

  useEffect(() => {
    // Basic fingerprint: userAgent + screen + tz + lang + platform + cookies
    try {
      const userAgent = navigator.userAgent
      const screenResolution = `${window.screen.width}x${window.screen.height}`
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      const language = navigator.language
      const platform = navigator.platform
      const cookiesEnabled = navigator.cookieEnabled
      const raw = [userAgent, screenResolution, timezone, language, platform, String(cookiesEnabled)].join('|')
      // Hash-like simple encoder
      const fp = btoa(unescape(encodeURIComponent(raw))).slice(0, 128)
      setFormData(prev => ({ ...prev, fingerprint: fp }))
    } catch {}
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setMessage("")

    try {
      const validatedData = signInSchema.parse(formData)

      // First, verify credentials and check if 2FA is required
      const verifyResponse = await fetch('/api/auth/verify-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: validatedData.email,
          password: validatedData.password,
        }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        setMessage(verifyData.error || "Authentication failed")
        return
      }

      if (verifyData.requires2FA) {
        // Redirect to 2FA page with credentials
        const params = new URLSearchParams({
          email: validatedData.email,
          password: validatedData.password,
          rememberMe: rememberMe.toString(),
        })
        router.push(`/auth/2fa?${params.toString()}`)
        return
      }

      // If no 2FA required, proceed with normal sign-in
      const result = await signIn("credentials", {
        redirect: false,
        email: validatedData.email,
        password: validatedData.password,
        fingerprint: validatedData.fingerprint,
        rememberMe: rememberMe.toString(),
      })

      if (result?.error) {
        setMessage(result.error)
      } else if (result?.ok) {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('rememberMe')
        }
        router.push("/dashboard")
      }
    } catch (error) {
      if (error instanceof Error) {
        try {
          const zodError = JSON.parse(error.message)
          const fieldErrors: Partial<SignInData> = {}
          zodError.forEach((err: any) => {
            fieldErrors[err.path[0] as keyof SignInData] = err.message
          })
          setErrors(fieldErrors)
        } catch (parseError) {
          setMessage("An unexpected error occurred.")
        }
      } else {
        setMessage("An unexpected error occurred.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setMessage("")
    try {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberMe')
      }
      await signIn("google", {
        callbackUrl: `${window.location.origin}/dashboard`,
      })
    } catch (error) {
      setMessage("Failed to sign in with Google")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof SignInData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className='logo-font text-sm'>logger</h1>
      <Card className="w-full max-w-md border-none shadow-none bg-gray-50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {state == 0 ? (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                className='rounded-full'
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && <Alert>
                <AlertDescription>{errors.email}</AlertDescription>
              </Alert>}
            </div>):<></>}
            {state == 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className='rounded-full'
                  value={formData.password}
                  onChange={handleChange("password")}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                {errors.password && <Alert>
                  <AlertDescription>{errors.password}</AlertDescription>
                </Alert>}
              </div>



              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label 
                    htmlFor="remember-me" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </>
            ) : <></>}
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            {state === 1 ? (
              <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            ) : (
              <Button type="button"
                onClick={() => {
                  setState(1)
                }}
                className="w-full rounded-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            )}
          </form>
          <div className="relative mt-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>
          <div className="pt-4">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full bg-transparent rounded-full"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="text-blue-600 hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}