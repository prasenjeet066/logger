"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react" // Import signOut from next-auth/react
import { Spinner } from "@/components/loader/spinner" // Updated import path
import { Sidebar } from "./sidebar"
import { Timeline } from "./timeline"
import { TrendingHashtags } from "./trending-hashtags"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { SearchDialog } from "./search-dialog"
import { NotificationDialog } from "./notification-dialog"
import { Button } from "@/components/ui/button"
import { Menu, UserIcon, Plus, Search } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import Link from "next/link"
import type { IUser } from "@/lib/mongodb/models/User" // Import IUser type
import { Header } from "@/components/dashboard/utils/header"
interface DashboardContentProps {
  // The user prop now represents the session user from NextAuth, which should align with IUser
  user: {
    id: string
    email: string
    username: string
    displayName: string
    avatarUrl ? : string
  }
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [profile, setProfile] = useState < IUser | null > (null)
  const [isLoading, setIsLoading] = useState(true)
  //const isMobile = useMobile();
  
  useEffect(() => {
    fetchProfile()
  }, [user.id]) // Depend on user.id to refetch if user changes
  
  const fetchProfile = async () => {
    try {
      // Fetch profile from your new MongoDB-backed API route
      const response = await fetch("/api/users/current")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: IUser = await response.json()
      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
      // Optionally handle error, e.g., redirect to login or show a message
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/sign-in" }) // Redirect to sign-in page after sign out
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error: Could not load user profile.
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white">
      <Header profile={profile} handleSignOut = {handleSignOut}/>
      
      <div className="flex h-full">
      
        

        {/* Main Content */}
        <div className="flex-1 max-w-2xl border-r">
          <Timeline userId={profile._id} /> {/* Pass MongoDB _id */}
        </div>

        {/* Right Sidebar */}
        <div className="hidden xl:block w-80 p-4">
          <TrendingHashtags />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <MobileBottomNav profile={profile} />
      </div>

      {/* Mobile Create Post FAB */}
      
     

      <SearchDialog />
      <NotificationDialog />
    </div>
  )
}