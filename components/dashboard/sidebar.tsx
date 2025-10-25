"use client"
import { GetStaticProps } from 'next'
import { useTranslation } from 'react-i18next'
import {Icon} from '@/components/font-awesome/icon'
// Remove this import if using client-side only, or keep for SSR pages
// import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Search, Bell, Mail, Bookmark, User, LogOut, X, Settings, Key, Plus } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

interface SidebarProps {
  profile: any
  isExpand: boolean
  onSignOut: () => void
  newSidebar?: any[]  
  contextChangeTabs?: [string, (tab: string) => void]
}

export function Sidebar({ isExpand = true, profile, onSignOut, newSidebar, contextChangeTabs }: SidebarProps) {
  const { t, ready, i18n } = useTranslation("lang")
  const isMobile = useMobile()
  const [isSA, setIsSA] = useState<string | null>(null)
  const [isI18nReady, setIsI18nReady] = useState(false)

  useEffect(() => {
    if (profile?.superAccess?.role) {
      setIsSA(profile.superAccess.role)
    } else {
      setIsSA(null)
    }
  }, [profile])

  // Handle i18n initialization with timeout
  useEffect(() => {
    const checkI18nReady = () => {
      if (ready && i18n.isInitialized) {
        setIsI18nReady(true)
      } else {
        // Force ready after 2 seconds to prevent infinite loading
        const timeout = setTimeout(() => {
          setIsI18nReady(true)
        }, 2000)
        return () => clearTimeout(timeout)
      }
    }
    
    checkI18nReady()
  }, [ready, i18n.isInitialized])

  // Don't show loading, just use fallbacks if not ready
  const safeT = (key: string, fallback: string) => {
    if (!isI18nReady) return fallback
    return t(key, fallback)
  }

  const menuItems = [
    { icon: 'home', label: safeT("home", "Home"), href: "/dashboard" },
    { icon: 'search', label: safeT("explore", "Explore"), href: "/explore" },
    { icon: 'bell', label: safeT("notifications", "Notifications"), href: "/notifications" },
    { icon: 'comment-alt', label: safeT("messages", "Messages"), href: "/messages" },
    { icon: 'bookmark', label: safeT("bookmarks", "Bookmarks"), href: "/bookmarks" },
    { icon: 'user', label: safeT("profile", "Profile"), href: `/profile/${profile?.username}` },
    { icon: 'gear', label: safeT("settings", "Settings"), href: "/settings" },
  ]

  

  let finalMenuItems = menuItems
  if (newSidebar !== undefined && Array.isArray(newSidebar) && newSidebar.length > 0) {
    finalMenuItems = newSidebar
  }

  return (
    <div className={isMobile ? "h-full w-full flex flex-col p-3 z-50" : "h-auto flex flex-col p-3 z-50 bg-white rounded-lg"}>
      {/* Close button for mobile */}
      {isMobile && (
        <div className="lg:hidden flex justify-between items-center mb-4 pb-2 border-b">
          <h1 className="text-xl logo-font">blue</h1>
          <Button variant="ghost" size="icon" onClick={() => window.dispatchEvent(new Event("closeSidebar"))}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {!isMobile && (
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl logo-font">blue</h1>
        </div>
      )}

      <nav className="flex-1 space-y-1 bg-white">
        {finalMenuItems.map((item, index) => (
          <div key={item.href || index}>
            {item.tabData && (!item.href || item.href === null) ? (
              <Button 
                variant="ghost" 
                className="w-full flex flex-row justify-start items-center text-base lg:text-lg py-3 lg:py-6 px-3" 
                onClick={() => {
                  contextChangeTabs?.[1](item.tabData)
                }}
              >
                <Icon prefi='far' name={item.icon} className="mr-2 w-5 h-5" />
                {(isExpand === true || isMobile) && (
                  <span className="truncate">{item.label}</span>
                )}
              </Button>
            ) : (
              <Link href={item.href}>
                <Button variant="ghost" className="flex flex-row w-full justify-start items-center text-base lg:text-lg py-3 px-3">
                  <Icon prefix='far' name={item.icon} className="mr-2 w-5 h-5" />

                  {(isExpand === true || isMobile) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {isMobile && (
        <div className="border-t w-full pt-3 mt-3 flex flex-row items-center justify-between">
          <Link href="/create">
            <Button className="w-full justify-center mt-4 py-3  bg-indigo-600 text-white">
              <Plus className=" h-5 w-5" />
              <span>{safeT("createPost", "Create New Log")}</span>
            </Button>
          </Link>
          
          <Button
            variant="ghost"
            className="bg-none  justify-start mt-4 text-sm"
            onClick={onSignOut}
          >
            <LogOut className=" h-4 w-4" />
          
          </Button>
        </div>
      )}
    </div>
  )
}