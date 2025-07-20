"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  User,
  Bell,
  Shield,
  Palette,
  Key,
  CreditCard,
  Globe,
  HelpCircle,
  SettingsIcon,
  ChevronRight,
  X,
} from "lucide-react"

interface SettingsSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  isMobile?: boolean
  onClose?: () => void
}

const settingsItems = [
  {
    id: "account",
    label: "Account",
    icon: User,
    description: "Profile information and basic settings",
  },
  {
    id: "security",
    label: "Security",
    icon: Key,
    description: "Password and authentication settings",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Email and push notification preferences",
  },
  {
    id : "superaccess",
    label : "Super Access",
    icon : Key,
    description:""
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: Shield,
    description: "Privacy controls and data settings",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    description: "Theme and display preferences",
  },
  {
    id: "language",
    label: "Language & Region",
    icon: Globe,
    description: "Language and regional settings",
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    description: "Subscription and payment settings",
  },
  {
    id: "help",
    label: "Help & Support",
    icon: HelpCircle,
    description: "Get help and contact support",
  },
]

export function SettingsSidebar({ activeSection, onSectionChange, isMobile = false, onClose }: SettingsSidebarProps) {
  return (
    <div className={cn("bg-white border-r border-gray-200 h-full", isMobile ? "w-full" : "w-80")}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500">Manage your account preferences</p>
            </div>
          </div>
          {isMobile && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-4 space-y-1">
        {settingsItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto p-4 text-left hover:bg-gray-50",
                isActive && "bg-blue-50 text-blue-700 hover:bg-blue-50",
              )}
              onClick={() => {
                onSectionChange(item.id)
                if (isMobile && onClose) onClose()
              }}
            >
              <div className="flex items-center gap-3 flex-1">
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</div>
                </div>
                <ChevronRight className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-300")} />
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
