"use client"
import {
  useState,
  useEffect
} from "react"
import { signOut } from "next-auth/react"
import { Spinner } from "@/components/loader/spinner"
import { CreatePost } from '@/components/dashboard/create-post'
import { Sidebar } from "@/components/dashboard/sidebar"
import { Timeline } from "@/components/dashboard/timeline"
import { TrendingHashtags } from "@/components/dashboard/trending-hashtags"
import { SearchDialog } from "@/components/dashboard/search-dialog"
import { NotificationDialog } from "@/components/dashboard/notification-dialog"
import { Header } from "@/components/dashboard/web/utils/header"
import type { IUser } from "@/lib/mongodb/models/User"

interface DashboardContentProps {
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
  const [sidebarExpand, setSidebarExpand] = useState<boolean>(false)
  const [showCreatePost, setShowCreatePost] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [user.id])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/users/current")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: IUser = await response.json()
      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/sign-in" })
  }

  const handleCreatePost = () => {
    setShowCreatePost(true)
    // You can also scroll to create post section or open a modal
    const createPostElement = document.getElementById('create-post-section')
    if (createPostElement) {
      createPostElement.scrollIntoView({ behavior: 'smooth' })
    }
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
      {/* Header Component */}
      <Header
        profile={profile}
        sidebarExpand={sidebarExpand}
        setSidebarExpand={setSidebarExpand}
        onCreatePost={handleCreatePost}
      />
      
      <div className="flex gap-2 h-full">
        {/* Desktop Sidebar */}
        <div className={`border-r max-h-screen max-w-64 h-screen sticky top-0 transition-all duration-200 ${sidebarExpand == false && "w-16"}`}>
          <Sidebar profile={profile} onSignOut={handleSignOut} isExpand={sidebarExpand}/>
        </div>

        {/* Main Content */}
        <div className="w-full">
          <div className='p-2' id="create-post-section">
            <CreatePost onPostCreated={(post) => {
              setShowCreatePost(false)
              // Handle post creation
            }}/>
          </div>
          <Timeline userId={profile._id} />
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