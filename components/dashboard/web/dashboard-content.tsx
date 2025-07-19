"use client"
import {
  useState,
  useEffect,
  useCallback
} from "react"
import { signOut } from "next-auth/react" // Import signOut from next-auth/react
import { Spinner } from "@/components/loader/spinner" // Updated import path
import {CreatePost} from '@/components/dashboard/create-post'
import { Sidebar } from "@/components/dashboard/sidebar"
import { Timeline } from "@/components/dashboard/timeline"
import { TrendingHashtags } from "@/components/dashboard/trending-hashtags"
import { SearchDialog } from "@/components/dashboard/search-dialog"
import { NotificationDialog } from "@/components/dashboard/notification-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Menu, Search, User as UserIcon } from "lucide-react"
import { debounce } from "lodash"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import type { IUser } from "@/lib/mongodb/models/User" // Import IUser type
interface UserProfile {
  _id: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  followersCount: number
  isFollowing: boolean
  isVerified ? : boolean
}
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

export function WebDashboardContent({ user }: DashboardContentProps) {
  const [profile, setProfile] = useState < IUser | null > (null)
  const [isLoading, setIsLoading] = useState(true)
  const [Posts, setPosts] = useState([])
  const [Users, setUsers] = useState < UserProfile[] > ([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarExpand, setSidebarExpand] = useState < boolean > (false)
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setUsers([])
        setPosts([])
        return
      }
      
      //setIsLoading(true)
      try {
        // Search users and posts
        const [usersResponse, postsResponse] = await Promise.all([
          fetch(`/api/users/search?q=${encodeURIComponent(query)}`),
          fetch(`/api/posts/search?q=${encodeURIComponent(query)}`),
        ])
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData)
        }
        
        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          setPosts(postsData)
        }
      } catch (error) {
        console.error("Error searching:", error)
      } finally {
        // setIsLoading(false)
      }
    }, 300),
    [],
  )
  useEffect(() => {
    fetchProfile()
  }, [user.id]) // Depend on user.id to refetch if user changes
  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])
  const searchUsers = () => {
    
  }
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
            <div className=' relative flex flex-row items-center justify-between gap-2 bg-none h-8 border-2 border-gray-300 rounded-full px-4 py-2'>
              <input
  type='text'
  className='outline-none bg-none border-0 w-full pl-10 text-sm lg:text-base'
  placeholder='Search with us...'
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyPress={(e) => e.key === "Enter" && searchUsers()}
/>
              <Search className='h-3 w-3'/>
              {searchQuery.length> 0 && (
                <div className='fixed top-[20px] bg-white shadow-md rounded-md flex flex-col items-start'>
                  {Users.length > 0 ? (<>
                  {Users.map((user) => (
  <Link key={user._id} href={`/profile/${user.username}`}>
    <div className='flex items-center justify-between p-2 border-b w-full'>
     <small>{user.displayName}</small>
    </div>
  </Link>

))}
</>
                 ):<>
                   <small>{`Search for ${searchQuery}`}</small>
                 </>} 
                </div>
              )}
            </div>
            
            {/* Create New Button */}
            <Button className="bg-gray-800 text-white px-4 h-8 py-2 rounded-full" onClick={()=>{
              
            }}>
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
      
      <div className="flex  gap-2 h-full">
        {/* Desktop Sidebar */}
        <div className={`border-r max-h-screen max-w-64 h-screen sticky top-0 ${sidebarExpand == false && "w-16"}`}>
          <Sidebar profile={profile} onSignOut={handleSignOut} isExpand={sidebarExpand}/>
        </div>

        {/* Main Content */}
        <div className="w-full mt">
          <div className =''>
            <CreatePost onPostCreated={(post)=>{
              
            }}/>
          </div>
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