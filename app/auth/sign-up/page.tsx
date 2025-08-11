
"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signUpSchema, type SignUpData } from "@/lib/validations/auth"
import { TermsAndConditions } from "@/components/auth/terms-and-conditions"
import { StepNavigation } from "@/components/auth/StepNavigation"
import { signupSteps } from "@/config/signupSteps"
import profile_categories from '@/lib/profile-categorys'

export default function SignUpPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    displayName: "",
    category: "",
    acceptTerms: false,
    showPassword: false,
    showConfirmPassword: false,
    usernameStatus: null, // "available" | "taken" | null
    checkingUsername: false,
    availableCategories: profile_categories.map(item => item.name),
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("error")
  const [showTerms, setShowTerms] = useState(false)
  
  const router = useRouter()
  const currentStep = signupSteps[currentStepIndex]

  // Field change handler
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Action handler for step-specific actions
  const handleAction = async (action: string, data?: any) => {
    switch (action) {
      case "googleSignUp":
        setIsLoading(true)
        setMessage("")
        try {
          await signIn("google", {
            callbackUrl: `${window.location.origin}/dashboard`,
          })
        } catch (error) {
          setMessage("Failed to sign up with Google")
        } finally {
          setIsLoading(false)
        }
        break
        
      case "checkUsername":
        setFormData(prev => ({ ...prev, checkingUsername: true }))
        try {
          const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(data)}`)
          const result = await res.json()
          setFormData(prev => ({ 
            ...prev, 
            usernameStatus: result.available ? "available" : "taken",
            checkingUsername: false 
          }))
        } catch (error) {
          console.error("Username check failed:", error)
          setFormData(prev => ({ ...prev, checkingUsername: false }))
        }
        break
        
      case "showTerms":
        setShowTerms(true)
        break
    }
  }

  // Validation
  const validateCurrentStep = (): boolean => {
    const stepErrors = currentStep.validate(formData)
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  // Navigation
  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStepIndex < signupSteps.length - 1) {
        setCurrentStepIndex(prev => prev + 1)
      }
    }
  }
  
  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  // Form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return
    
    setIsLoading(true)
    setMessage("")
    setMessageType("error")
    
    try {
      const validatedData = signUpSchema.parse({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        displayName: formData.displayName,
        category: formData.category,
      })
      
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setMessage(data.error || "Failed to create account")
        setMessageType("error")
      } else {
        setMessage("Account created successfully! Check your email for a confirmation link.")
        setMessageType("success")
        
        // Reset form
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          username: "",
          displayName: "",
          category: "",
          acceptTerms: false,
          showPassword: false,
          showConfirmPassword: false,
          usernameStatus: null,
          checkingUsername: false,
          availableCategories: profile_categories.map(item => item.name),
        })
        setCurrentStepIndex(0)
      }
    } catch (error) {
      console.error("Form submission error:", error)
      setMessage("An unexpected error occurred.")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  // Render current step component
  const CurrentStepComponent = currentStep.component

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-none border-none bg-gray-50">
        <CardHeader className="text-center">
          <CardTitle className="text-sm logo-font">logger</CardTitle>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Step {currentStepIndex + 1} / {signupSteps.length}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={(e) => e.preventDefault()}>
            <CurrentStepComponent
              formData={formData}
              errors={errors}
              isLoading={isLoading}
              onFieldChange={handleFieldChange}
              onAction={handleAction}
            />

            {message && (
              <Alert className={`mt-4 ${messageType === "success" ? "border-green-500 bg-green-50" : ""}`}>
                <AlertDescription className={messageType === "success" ? "text-green-700" : ""}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <StepNavigation
              currentStepIndex={currentStepIndex}
              totalSteps={signupSteps.length}
              isLoading={isLoading}
              canProceed={formData.acceptTerms}
              onPrevious={prevStep}
              onNext={nextStep}
              onSubmit={handleSubmit}
            />
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="text-blue-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <TermsAndConditions open={showTerms} onOpenChange={setShowTerms}/>
      </div>
)
}