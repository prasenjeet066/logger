"use client"

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
  newSidebar ?: any[]  
  contextChangeTabs?: [string, (tab: string) => void]
}

export function Sidebar({ isExpand = true, profile, onSignOut, newSidebar ,  contextChangeTabs}: SidebarProps) {
  const isMobile = useMobile()
  const [isSA, setIsSA] = useState(null)
  useEffect(() => {
    if (profile.superAccess && profile.superAccess.role) {
      setIsSA(profile.superAccess?.role)
    } else {
      setIsSA(null)
    }
  }, [profile])
  const menuItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Search, label: "Explore", href: "/explore" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    
    { icon: Mail, label: "Messages", href: "/messages" },
    { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
    { icon: User, label: "Profile", href: `/profile/${profile?.username}` },
    { icon: Settings, label: "Settings", href: "/settings" },
  ]
  if (isSA !== null) {
    menuItems.push({
      icon: Key,
      label: "Super Access",
      href: "/super-access"
    })
  }
let finalMenuItems = menuItems;
if (newSidebar !== undefined && Array.isArray(newSidebar) && newSidebar.length > 0) {
  finalMenuItems = newSidebar;
}
  return (
    
    <div className={isMobile ? "h-full flex flex-col p-3 z-50" : "h-auto flex flex-col p-3 z-50 bg-white rounded-lg "}>
      {/* Close button for mobile */}
      {isMobile && (
      <div className="lg:hidden flex justify-between items-center mb-4 pb-2 border-b">
        <h1 className="text-xl font-semibold logo-font">Zeeta</h1>
        <Button variant="ghost" size="icon" onClick={() => window.dispatchEvent(new Event("closeSidebar"))}>
          <X className="h-5 w-5" />
        </Button>
      </div>
)}
{!isMobile && (
      
      <div className="hidden lg:block mb-6">
        <h1 className="text-2xl font-semibold logo-font">Zeeta</h1>
      </div>
      )}

      <nav className="flex-1 space-y-1 bg-white">
        {finalMenuItems.map((item) => (
        <>
        {item.tabData && (!item.href || item.href ===null) ? (<>
          <Button variant="ghost" className="w-full justify-start text-base lg:text-lg py-3 lg:py-6 px-3" onClick = {()=>{
            contextChangeTabs[1](item.tabData)
          }}>
            
              <item.icon className="mr-3 h-5 w-5 lg:h-6 lg:w-6" />
              {isExpand==true || isMobile ?  (
              <span className="truncate">{item.label}</span>
              ):<></>}
            </Button>
        </>):(
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" className="w-full justify-start text-base lg:text-lg py-3 lg:py-6 px-3">
              <item.icon className="mr-3 h-5 w-5 lg:h-6 lg:w-6" />
              {isExpand==true || isMobile ?  (
              <span className="truncate">{item.label}</span>
              ):<></>}
            </Button>
          </Link>)}</>
        ))}

        {/* Create Post Button */}

      </nav>
      {isMobile && (
      <div className="border-t w-auto pt-3 mt-3">
        
        <Link href="/create">
          <Button className="w-full justify-center mt-4 py-3 lg:py-6">
            <Plus className="mr-2 h-5 w-5" />
            <span>Create Post</span>
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          className="w-full justify-start mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
          onClick={onSignOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>)}
    </div>
  )
}