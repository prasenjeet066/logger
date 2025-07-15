"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase/client"
import { signInSchema, type SignInData } from "@/lib/validations/auth"
import { Loader2 } from "lucide-react"

export default function SignInPage() {
  const [formData, setFormData] = useState<SignInData>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Partial<SignInData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setMessage("")

    try {
      const validatedData = signInSchema.parse(formData)

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      if (error instanceof Error) {
        const zodError = JSON.parse(error.message)
        const fieldErrors: Partial<SignInData> = {}
        zodError.forEach((err: any) => {
          fieldErrors[err.path[0] as keyof SignInData] = err.message
        })
        setErrors(fieldErrors)
      }
    } finally {
      setIsLoading(false)
    }
  }
 const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        setMessage("Google দিয়ে সাইন আপ করতে সমস্যা হয়েছে")
        //setMessageT("error")
      }
    } catch (error) {
     setMessage("Google দিয়ে সাইন আপ করতে সমস্যা হয়েছে")
     // setMessageType("error")
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 bengali-font">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold logo-font">Cōdes</CardTitle>
          <CardDescription>আবার স্বাগতম</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                placeholder="আপনার ইমেইল লিখুন"
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange("password")}
                placeholder="আপনার পাসওয়ার্ড লিখুন"
                disabled={isLoading}
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
            <Link href="/auth/forgot-password" className="text-sm text-right text-blue-600 hover:underline pt-4">
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              সাইন ইন করুন
            </Button>
          </form>
          <div className="relative mt-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">অথবা</span>
              </div>
            </div>
          <div className="pt-4">
              <Button
                type="button"
                onClick={handleGoogleSignUp}
                variant="outline"
                className="w-full bg-transparent"
                
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
                Google দিয়ে সাইন আপ করুন
              </Button>
            </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              কোনো অ্যাকাউন্ট নেই?{" "}
              <Link href="/auth/sign-up" className="text-blue-600 hover:underline">
                সাইন আপ করুন
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
      }
