// components/auth/steps/ProfileStep.tsx
"use client"

import React, { useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, XCircle, User } from "lucide-react"
import type { StepProps } from "@/types/signup"

export const ProfileStep: React.FC<StepProps> = ({ 
  formData, 
  errors, 
  isLoading, 
  onFieldChange, 
  onAction 
}) => {
  // Username availability check with debounce
  useEffect(() => {
    if (formData.username && formData.username.length >= 3) {
      const timeoutId = setTimeout(() => {
        onAction?.("checkUsername", formData.username)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.username, onAction])

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Profile Information</h3>
        <p className="text-sm text-gray-600">Your username and display name</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            value={formData.username || ""}
            onChange={(e) => onFieldChange("username", e.target.value)}
            placeholder="Choose a username"
            disabled={isLoading}
            className={`rounded-full pr-10 ${
              errors.username
                ? "border-red-500"
                : formData.usernameStatus === "available"
                  ? "border-green-500"
                  : formData.usernameStatus === "taken"
                    ? "border-red-500"
                    : ""
            }`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {formData.checkingUsername ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : formData.usernameStatus === "available" ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : formData.usernameStatus === "taken" ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : null}
          </div>
        </div>
        {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
        {formData.usernameStatus === "taken" && !errors.username && (
          <p className="text-sm text-red-600">This username is already taken</p>
        )}
        {formData.usernameStatus === "available" && (
          <p className="text-sm text-green-600">Username is available</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          type="text"
          value={formData.displayName || ""}
          onChange={(e) => onFieldChange("displayName", e.target.value)}
          placeholder="Your display name"
          disabled={isLoading}
          className={errors.displayName ? "border-red-500" : ""}
        />
        {errors.displayName && <p className="text-sm text-red-600">{errors.displayName}</p>}
      </div>
    </div>
  )
}

export const validateProfileStep = (formData: any): Record<string, string> => {
  const errors: Record<string, string> = {}
  
  if (!formData.username) {
    errors.username = "Username is required"
  } else if (formData.username.length < 3) {
    errors.username = "Username must be at least 3 characters long"
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    errors.username = "Username can only contain letters, numbers, and underscores"
  }
  
  if (!formData.displayName) {
    errors.displayName = "Display name is required"
  } else if (formData.displayName.length > 50) {
    errors.displayName = "Display name must be less than 50 characters"
  }
  
  return errors
}