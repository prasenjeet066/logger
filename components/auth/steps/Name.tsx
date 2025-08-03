// components/auth/steps/ProfileStep.tsx
"use client"

import React, { useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, XCircle, User } from "lucide-react"
import type { StepProps } from "@/types/signup"

export const NameStep: React.FC<StepProps> = ({ 
  formData, 
  errors, 
  isLoading, 
  onFieldChange, 
  onAction 
}) => {
  // Username availability check with debounce
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Profile Name</h3>
        <p className="text-sm text-gray-600">Your display name</p>
      </div>

     
      <div className="space-y-2">
        <Label htmlFor="displayName">Full Name</Label>
        <Input
          id="displayName"
          type="text"
          value={formData.displayName || ""}
          onChange={(e) => onFieldChange("displayName", e.target.value)}
          placeholder="Your full name"
          disabled={isLoading}
          className={errors.displayName ? "border-red-500" : ""}
        />
        {errors.displayName && <p className="text-sm text-red-600">{errors.displayName}</p>}
      </div>
    </div>
  )
}

export const validateNameStep = (formData: any): Record<string, string> => {
  const errors: Record<string, string> = {}
  
  
  if (!formData.displayName) {
    errors.displayName = "Display name is required"
  } else if (formData.displayName.length > 50) {
    errors.displayName = "Display name must be less than 50 characters"
  }else if (formData.displayName.split(' ').length === 0) {
    errors.displayName = 'Must need a last name'
  }
  
  return errors
}