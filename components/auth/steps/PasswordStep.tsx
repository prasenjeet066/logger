// components/auth/steps/PasswordStep.tsx
"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock } from "lucide-react"
import type { StepProps } from "@/types/signup"

export const PasswordStep: React.FC<StepProps> = ({ 
  formData, 
  errors, 
  isLoading, 
  onFieldChange, 
  onAction 
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Password Setup</h3>
        <p className="text-sm text-gray-600">Create a strong password</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={formData.showPassword ? "text" : "password"}
            value={formData.password || ""}
            onChange={(e) => onFieldChange("password", e.target.value)}
            placeholder="Create a password"
            disabled={isLoading}
            className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
          />
          <button
            type="button"
            onClick={() => onFieldChange("showPassword", !formData.showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            disabled={isLoading}
          >
            {formData.showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={formData.showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword || ""}
            onChange={(e) => onFieldChange("confirmPassword", e.target.value)}
            placeholder="Re-enter password"
            disabled={isLoading}
            className={`pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
          />
          <button
            type="button"
            onClick={() => onFieldChange("showConfirmPassword", !formData.showConfirmPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            disabled={isLoading}
          >
            {formData.showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>Password must:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Be at least 8 characters long</li>
          <li>Contain uppercase and lowercase letters</li>
          <li>Contain at least one number</li>
          <li>Optionally contain special characters</li>
        </ul>
      </div>
    </div>
  )
}

export const validatePasswordStep = (formData: any): Record<string, string> => {
  const errors: Record<string, string> = {}
  
  if (!formData.password) {
    errors.password = "Password is required"
  } else if (formData.password.length < 8) {
    errors.password = "Password must be at least 8 characters long"
  }
  
  if (!formData.confirmPassword) {
    errors.confirmPassword = "Confirm password is required"
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match"
  }
  
  return errors
}
