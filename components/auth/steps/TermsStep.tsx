// components/auth/steps/TermsStep.tsx
"use client"

import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText } from "lucide-react"
import type { StepProps } from "@/types/signup"

export const TermsStep: React.FC<StepProps> = ({ 
  formData, 
  errors, 
  isLoading, 
  onFieldChange, 
  onAction 
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Terms and Privacy</h3>
        <p className="text-sm text-gray-600">Read the terms before finalizing</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <h4 className="font-medium">Your Information:</h4>
        <div className="text-sm space-y-1">
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Username:</strong> @{formData.username}</p>
          <p><strong>Display Name:</strong> {formData.displayName}</p>
          <p><strong>Category:</strong> {formData.category}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="acceptTerms"
            checked={formData.acceptTerms || false}
            onCheckedChange={(checked) => onFieldChange("acceptTerms", checked)}
            disabled={isLoading}
          />
          <div className="text-sm">
            <label htmlFor="acceptTerms" className="cursor-pointer">
              I have read and agree to the{" "}
              <button 
                type="button" 
                onClick={() => onAction?.("showTerms")} 
                className="text-blue-600 hover:underline"
              >
                Terms and Privacy Policy
              </button>
            </label>
          </div>
        </div>
        {errors.acceptTerms && <p className="text-sm text-red-600">{errors.acceptTerms}</p>}
      </div>
    </div>
  )
}

export const validateTermsStep = (formData: any): Record<string, string> => {
  const errors: Record<string, string> = {}
  
  if (!formData.acceptTerms) {
    errors.acceptTerms = "You must accept the terms and conditions"
  }
  
  return errors
}
