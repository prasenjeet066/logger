"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/loader/spinner"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default function PrivacyAndPersonalSettings() {
  const [currentUser, setCurrentUser] = useState<object | null>(null)
  const [errors, setErrors] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, boolean> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Define all settings with sections
  const settingsSections = [
    {
      title: "Privacy",
      items: [
        {
          label: "Lock your profile",
          description: "Only approved followers can see your full profile details.",
          id: "lock_profile",
          default: false,
        },
        {
          label: "Hide your following list",
          description: "Others won't be able to see who you are following.",
          id: "hide_following_list",
          default: false,
        },
        {
          label: "Show activity status",
          description: "Let others see when you're active or last active on the platform.",
          id: "show_activity_status",
          default: true,
        },
      ],
    },
    {
      title: "Messaging",
      items: [
        {
          label: "Allow messages from everyone",
          description: "Anyone on the platform can send you a direct message.",
          id: "public_send_message",
          default: true,
        },
      ],
    },
    {
      title: "Visibility & Search",
      items: [
        {
          label: "Show profile in search results",
          description: "Allow your profile to appear in platform and external search engines.",
          id: "show_in_search",
          default: true,
        },
      ],
    },
    {
      title: "Ads & Personalization",
      items: [
        {
          label: "Personalized ads",
          description: "Receive ads tailored based on your activity and interests.",
          id: "personalized_ads",
          default: true,
        },
      ],
    },
  ]

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/users/current')
        if (res.ok) {
          const user = await res.json()
          setCurrentUser(user)
          
          // Initialize form values with user data or defaults
          const initial = settingsSections.reduce((acc, section) => {
            section.items.forEach((item) => {
              acc[item.id] = user[item.id] !== undefined ? user[item.id] : item.default
            })
            return acc
          }, {} as Record<string, boolean>)
          
          setFormValues(initial)
        } else {
          setErrors(res.statusText)
        }
      } catch (error) {
        setErrors(String(error))
      }
    }
    
    fetchCurrentUser()
  }, [])

  // Toggle switch handler
  const handleToggle = (id: string) => {
    setFormValues((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors(null)
    
    try {
      const response = await fetch('/api/users/profile', {
        method: "PUT", // Changed from POST to PUT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update settings')
      }
      
      // Optionally show success message
      console.log('Settings updated successfully')
      
    } catch (error) {
      setErrors(String(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (!formValues) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="pt-4 flex flex-col gap-6">
      {errors && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{errors}</p>
        </div>
      )}
      
      {settingsSections.map((section) => (
        <div key={section.title} className="flex flex-col gap-4 border-b pb-4">
          <h3 className="text-lg font-medium">{section.title}</h3>
          {section.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between">
              <div className="flex flex-col">
                <Label htmlFor={item.id}>{item.label}</Label>
                <span className="text-sm text-muted-foreground">{item.description}</span>
              </div>
              <Switch
                id={item.id}
                checked={formValues[item.id]}
                onCheckedChange={() => handleToggle(item.id)}
              />
            </div>
          ))}
        </div>
      ))}
      
      <div className="flex justify-end p-2 sticky bottom-0 bg-white w-full">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}