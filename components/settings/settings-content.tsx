"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SettingsSidebar } from "./settings-sidebar"
import { AccountSettings } from "./sections/account-settings"
import { SecuritySettings } from "./sections/security-settings"
import { NotificationSettings } from "./sections/notification-settings"
import { PrivacySettings } from "./sections/privacy-settings"
import { useMobile } from "@/hooks/use-mobile"
import { Menu, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

interface SettingsContentProps {
  user: any
}

export function SettingsContent({ user }: SettingsContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()
  const { data: session } = useSession()
  const [activeSection, setActiveSection] = useState("account")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return <AccountSettings user={user} />
      case "security":
        return <SecuritySettings />
      case "notifications":
        return <NotificationSettings />
      case "privacy":
        return <PrivacySettings />
      case "appearance":
        return <div className="p-8 text-center text-gray-500">Appearance settings coming soon...</div>
      case "language":
        return <div className="p-8 text-center text-gray-500">Language settings coming soon...</div>
      case "billing":
        return <div className="p-8 text-center text-gray-500">Billing settings coming soon...</div>
      case "help":
        return <div className="p-8 text-center text-gray-500">Help & Support coming soon...</div>
      default:
        return <AccountSettings user={user} />
    }
  }

  const getSectionTitle = () => {
    const sections: Record<string, string> = {
      account: "Account Settings",
      security: "Security Settings",
      notifications: "Notification Settings",
      privacy: "Privacy Settings",
      appearance: "Appearance Settings",
      language: "Language & Region",
      billing: "Billing Settings",
      help: "Help & Support",
    }
    return sections[activeSection] || "Settings"
  }

  useEffect(() => {
    fetchUserData()
  }, [user, session])

  const fetchUserData = async () => {
    if (!session?.user) return

    try {
      // Get current user profile
      const response = await fetch("/api/users/current")
      if (!response.ok) throw new Error("Failed to fetch user data")

      const userData = await response.json()
      // Update user state with fetched data
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user settings.",
        variant: "destructive",
      })
    }
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{getSectionTitle()}</h1>
          </div>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-full">
              <SettingsSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                isMobile={true}
                onClose={() => setSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Content */}
        <div className="p-4">{renderContent()}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{getSectionTitle()}</h1>
          <p className="text-gray-500">Manage your account preferences and settings</p>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        {/* Desktop Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl">{renderContent()}</div>
        </div>
      </div>
    </div>
  )
}
