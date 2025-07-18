"use client"
import { useState, useEffect } from "react"
import { signOut } from "next-auth/react" // Import signOut from next-auth/react
import { Spinner } from "@/components/loader/spinner" // Updated import path
import { Sidebar } from "@/components/dashboard/sidebar"
import { Timeline } from "@/components/dashboard/timeline"
import { TrendingHashtags } from "@/components/dashboard/trending-hashtags"
import { SearchDialog } from "@/components/dashboard/search-dialog"
import { NotificationDialog } from "@/components/dashboard/notification-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Menu ,Search , User as UserIcon} from "lucide-react"
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

export function WebDashboardContent({ user }: DashboardContentProps) {
  const [profile, setProfile] = useState<IUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [sidebarExpand , setSidebarExpand] = useState<boolean>(false)
  
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
      {/* Desktop Header */}
      <div className="sticky top-0 border-b bg-white bg-white/50 z-30 backdrop-blur-md px-4 py-2">
        <div className="flex items-center justify-between">
          <div className='flex flex-row items-center gap-2'>
          <Menu className='h-4 ml-2 w-4' onClick={()=>{
            setSidebarExpand(!sidebarExpand)
          }}/>
          
          <h1 className="text-xl font-bold logo-font">Cōdes</h1>
          </div>
          <div className="flex flex-row items-center gap-4">
            {/* Desktop Search Bar */}
            <div className='flex flex-row items-center gap-2 bg-none border-2 border-gray-300 rounded-full px-4 py-2'>
              <input type='text' className='outline-none bg-none border-0' placeholder='Search with us...'/>
              <Search className='h-3 w-3'/>
            </div>
            
            {/* Create New Button */}
            <Button className="bg-gray-800 text-white px-4 py-2 rounded-full">
              <Plus className="h-4 w-4"/>
              <small>Create New</small>
            </Button>

            {/* User Avatar */}
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
        {/* Desktop Sidebar */}
        <div className="border-r max-h-screen h-full sticky top-0 w-auto">
          <Sidebar profile={profile} onSignOut={handleSignOut} isExpand={sidebarExpand}/>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-2xl border-r">
          <Timeline userId={profile._id} /> {/* Pass MongoDB _id */}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 p-4">
          
        </div>
      </div>

      <SearchDialog />
      <NotificationDialog />
    </div>
  )
}