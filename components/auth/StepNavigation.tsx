// components/auth/StepNavigation.tsx
"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"

interface StepNavigationProps {
  currentStepIndex: number
  totalSteps: number
  isLoading: boolean
  canProceed?: boolean
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
}

export function StepNavigation({
  currentStepIndex,
  totalSteps,
  isLoading,
  canProceed = true,
  onPrevious,
  onNext,
  onSubmit
}: StepNavigationProps) {
  const isLastStep = currentStepIndex === totalSteps - 1

  return (
    <div className="flex justify-between mt-6">
      {currentStepIndex > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isLoading}
          className="flex items-center bg-transparent"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
      )}
      
      {!isLastStep ? (
        <Button 
          type="button" 
          onClick={onNext} 
          disabled={isLoading} 
          className="flex items-center rounded-full w-full"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      ) : (
        <Button 
          type="submit" 
          onClick={onSubmit}
          disabled={isLoading || !canProceed} 
          className="flex items-center rounded-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      )}
    </div>
  )
}
