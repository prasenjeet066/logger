"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default function PrivacyAndPersonalSettings() {
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
          description: "Others won’t be able to see who you are following.",
          id: "hide_following_list",
          default: false,
        },
        {
          label: "Show activity status",
          description: "Let others see when you’re active or last active on the platform.",
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

  // Initialize state for each setting using IDs
  const initialSettings = settingsSections.reduce((acc, section) => {
    section.items.forEach((item) => {
      acc[item.id] = item.default
    })
    return acc
  }, {} as Record<string, boolean>)

  const [formValues, setFormValues] = useState(initialSettings)

  // Toggle switch handler
  const handleToggle = (id: string) => {
    setFormValues((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Saving settings:", formValues)
    // Replace with your API call or toast
    alert("Settings saved successfully!")
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-6">
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

      <div className="flex justify-end pt-2">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  )
}