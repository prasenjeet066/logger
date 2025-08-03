// components/auth/steps/CategoryStep.tsx
"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tag } from "lucide-react"
import type { StepProps } from "@/types/signup"

export const CategoryStep: React.FC<StepProps> = ({ 
  formData, 
  errors, 
  isLoading, 
  onFieldChange 
}) => {
  const [suggestion, setSuggestion] = useState('')
  const [showSuggestion, setShowSuggestion] = useState(false)
  
  // Mock categories - replace with your actual categories
  const categories = formData.availableCategories || []

  useEffect(() => {
    const query = formData.category || ""
    
    if (query.length > 0) {
      const match = categories.find((item: string) =>
        item.toLowerCase().startsWith(query.toLowerCase())
      )
      
      if (match && match.toLowerCase() !== query.toLowerCase()) {
        setSuggestion(match)
        setShowSuggestion(true)
      } else {
        setSuggestion('')
        setShowSuggestion(false)
      }
    } else {
      setSuggestion('')
      setShowSuggestion(false)
    }
  }, [formData.category, categories])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && showSuggestion) {
      e.preventDefault()
      onFieldChange("category", suggestion)
      setShowSuggestion(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Choose Account Category</h3>
        <p className="text-sm text-gray-600">Select an account type or category from this list</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <div className="relative">
          <Input
            id="category"
            type="text"
            value={formData.category || ""}
            onChange={(e) => onFieldChange("category", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Choose a category"
            disabled={isLoading}
            className="rounded-full pr-10"
          />
          {showSuggestion && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-transparent select-none">{formData.category}</span>
              <span className="text-slate-400">{suggestion.slice((formData.category || "").length)}</span>
            </div>
          )}
        </div>
        {showSuggestion && (
          <p className="text-xs text-gray-500">Press Tab to autocomplete</p>
        )}
        {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
      </div>
    </div>
  )
}

export const validateCategoryStep = (formData: any): Record<string, string> => {
  const errors: Record<string, string> = {}
  
  if (!formData.category) {
    errors.category = "Category is required"
  }
  
  return errors
}
