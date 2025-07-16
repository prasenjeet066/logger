"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Search, Bell, Mail, User } from "lucide-react"

interface MobileBottomNavProps {
  profile: any
  onSearchOpen: () => void
  onNotificationOpen: () => void
}

export function MobileBottomNav({ profile, onSearchOpen, onNotificationOpen }: MobileBottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: "হোম", href: "/dashboard", action: null },
    { icon: Search, label: "খুঁজুন", href: "#", action: onSearchOpen },
    { icon: Bell, label: "বিজ্ঞপ্তি", href: "#", action: onNotificationOpen },
    { icon: Mail, label: "বার্তা", href: "/messages", action: null },
    { icon: User, label: "প্রোফাইল", href: `/profile/${profile?.username}`, action: null },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 lg:hidden">
      <nav className="flex justify-around h-16 items-center">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            size="icon"
            className={`flex flex-col gap-1 h-full w-full rounded-none ${
              pathname === item.href ? "text-blue-600" : "text-gray-500"
            }`}
            onClick={item.action || undefined}
            asChild={!item.action}
          >
            {item.action ? (
              <>
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </>
            ) : (
              <Link href={item.href}>
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )}
          </Button>
        ))}
      </nav>
    </div>
  )
}
