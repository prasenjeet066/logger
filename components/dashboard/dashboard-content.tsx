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
import { Menu, UserIcon, Plus , Search} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import Link from "next/link"
import type { IUser } from "@/lib/mongodb/models/User" // Import IUser type

interface DashboardContentProps {
  // The user prop now represents the session user from NextAuth, which should align with IUser
  user: {
    id: string
    email: string
    username: string
    displayName: string
    avatarUrl?: string
  }
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [profile, setProfile] = useState<IUser | null>(null)
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
      
      <div className="lg:hidden sticky top-0 border-b bg-white bg-white/50 z-30 backdrop-blur-md px-4 py-2">
        <div className="flex items-center justify-between">
          <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <Sidebar profile={profile} onSignOut={handleSignOut} />
              </SheetContent>
            </Sheet>
          <h1 className="text-xl font-bold logo-font">Cōdes</h1>
          <div className="flex flex-row w-full items-center justify-end">
            
            
          <Link href="/create">
          <Button size="icon" className="rounded-full h-8 w-8 bg-[transparent] text-gray-800">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>


            <Link href={`/profile/${profile?.username}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback>
                  <UserIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
      
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
