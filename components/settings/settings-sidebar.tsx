"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Bell, Lock, Palette, Globe, CreditCard, HelpCircle, Settings, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  className?: string
}

const settingSections = [
  {
    id: "account",
    label: "Account",
    description: "Manage your profile and personal information",
    icon: User,
    badge: null,
  },
  {
    id: "security",
    label: "Security & Login",
    description: "Password, 2FA, and login sessions",
    icon: Shield,
    badge: null,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Email, push, and sound preferences",
    icon: Bell,
    badge: "3",
  },
  {
    id: "privacy",
    label: "Privacy & Safety",
    description: "Control who can see your content",
    icon: Lock,
    badge: null,
  },
  {
    id: "appearance",
    label: "Display & Accessibility",
    description: "Theme, font size, and accessibility",
    icon: Palette,
    badge: null,
  },
  {
    id: "language",
    label: "Language & Region",
    description: "Language, country, and time zone",
    icon: Globe,
    badge: null,
  },
  {
    id: "billing",
    label: "Billing & Subscriptions",
    description: "Manage payments and subscriptions",
    icon: CreditCard,
    badge: null,
  },
  {
    id: "help",
    label: "Help & Support",
    description: "FAQ, contact support, and feedback",
    icon: HelpCircle,
    badge: null,
  },
]

export function SettingsSidebar({ activeSection, onSectionChange, className }: SettingsSidebarProps) {
  return (
    <div className={cn("w-80 bg-white border-r border-gray-200", className)}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Settings className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Manage your account preferences</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {settingSections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <Button
              key={section.id}
              variant="ghost"
              className={cn(
                "w-full justify-start p-4 h-auto text-left hover:bg-gray-50 transition-colors",
                isActive && "bg-blue-50 text-blue-700 hover:bg-blue-50 border-r-2 border-blue-500",
              )}
              onClick={() => onSectionChange(section.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={cn("p-2 rounded-lg", isActive ? "bg-blue-100" : "bg-gray-100")}>
                  <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-gray-600")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("font-medium text-sm", isActive ? "text-blue-900" : "text-gray-900")}>
                      {section.label}
                    </p>
                    {section.badge && (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                        {section.badge}
                      </Badge>
                    )}
                  </div>
                  <p className={cn("text-xs mt-1", isActive ? "text-blue-600" : "text-gray-500")}>
                    {section.description}
                  </p>
                </div>
                <ChevronRight
                  className={cn("h-4 w-4 transition-transform", isActive ? "text-blue-600 rotate-90" : "text-gray-400")}
                />
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
