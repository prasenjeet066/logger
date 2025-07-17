"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SettingsSidebar } from "./settings-sidebar"
import { AccountSettings } from "./sections/account-settings"
import { SecuritySettings } from "./sections/security-settings"
import { NotificationSettings } from "./sections/notification-settings"
import { PrivacySettings } from "./sections/privacy-settings"
import { Menu, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export function SettingsContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("account")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return <AccountSettings />
      case "security":
        return <SecuritySettings />
      case "notifications":
        return <NotificationSettings />
      case "privacy":
        return <PrivacySettings />
      case "appearance":
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Appearance settings coming soon...</p>
          </div>
        )
      case "language":
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Language settings coming soon...</p>
          </div>
        )
      case "billing":
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Billing settings coming soon...</p>
          </div>
        )
      case "help":
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Help & Support coming soon...</p>
          </div>
        )
      default:
        return <AccountSettings />
    }
  }

  const getSectionTitle = () => {
    const titles = {
      account: "Account Settings",
      security: "Security & Login",
      notifications: "Notifications",
      privacy: "Privacy & Safety",
      appearance: "Display & Accessibility",
      language: "Language & Region",
      billing: "Billing & Subscriptions",
      help: "Help & Support",
    }
    return titles[activeSection as keyof typeof titles] || "Settings"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{getSectionTitle()}</h1>
        </div>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SettingsSidebar
              activeSection={activeSection}
              onSectionChange={(section) => {
                setActiveSection(section)
                setSidebarOpen(false)
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            className="sticky top-0 h-screen"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto p-6">
            <div className="hidden lg:block mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{getSectionTitle()}</h1>
              <p className="text-gray-600">Manage your account preferences and settings</p>
            </div>

            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
