"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/loader/spinner" // Corrected import path
import {Header} from "@/components/dashboard/utils/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/dashboard/sidebar"
import {MutualFollowers} from "@/components/profile/mutual-follow"
import { PostCard } from "@/components/dashboard/post-card"
import { EditProfileDialog } from "./edit-profile-dialog"
import { Menu, X, UserPlus, UserCheck, Calendar, MapPin, LinkIcon , Plus , Search} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { ImageViewer } from "@/components/media/image-viewer"
import { VerificationBadge } from "@/components/badge/verification-badge"
import { signOut } from "next-auth/react"
import type { Post } from "@/types/post" // Import the updated Post type

interface ProfileContentProps {
  username: string
}

interface ProfileData {
  _id: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  website: string | null
  location: string | null
  createdAt: string
  postsCount: number
  isVerified: boolean
  followersCount: number
  followingCount: number
  isFollowing: boolean // Added for current user's follow status
}

export function ProfileContent({ username }: ProfileContentProps) {
  const { data: session, status } = useSession()
  const [currentUser, setCurrentUser] = useState < any > (null)
  const [profileData, setProfileData] = useState < ProfileData | null > (null)
  const [posts, setPosts] = useState < Post[] > ([])
  const [replies, setReplies] = useState < Post[] > ([])
  const [reposts, setReposts] = useState < Post[] > ([])
  const [media, setMedia] = useState < Post[] > ([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useMobile()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const [imageViewerOpen, setImageViewerOpen] = useState < string | null > (false)
  const router = useRouter()
  
  const fetchProfileData = useCallback(async () => {
    try {
      setIsLoading(true)
      // Get current user profile if logged in
      if (session?.user) {
        const currentUserResponse = await fetch("/api/users/current")
        if (currentUserResponse.ok) {
          const currentUserData = await currentUserResponse.json()
          setCurrentUser(currentUserData)
        }
      }
      
      // Get profile data and posts
      const profileResponse = await fetch(`/api/users/${username}`)
      if (!profileResponse.ok) {
        router.push("/")
        return
      }
      
      const { user: profile, posts: userPosts } = await profileResponse.json()
      setProfileData(profile)
      
      // Separate posts by type
      const regularPosts = userPosts.filter((post: Post) => !post.parentPostId && !post.isRepost)
      const replyPosts = userPosts.filter((post: Post) => post.parentPostId)
      const mediaPosts = userPosts.filter((post: Post) => post.mediaUrls && post.mediaUrls.length > 0)
      
      setPosts(regularPosts)
      setReplies(replyPosts)
      setMedia(mediaPosts)
      
      // Get reposts separately (already handled by the API route now)
      const repostsResponse = await fetch(`/api/users/${username}/reposts`)
      if (repostsResponse.ok) {
        const repostsData = await repostsResponse.json()
        setReposts(repostsData)
      }
    } catch (error) {
      console.error("Error fetching profile data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [username, session, router])
  
  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])
  
  const handleFollow = async () => {
    if (!profileData || !session?.user) return
    
    try {
      const response = await fetch(`/api/users/${profileData.username}/follow`, {
        method: "POST",
      })
      
      if (response.ok) {
        const result = await response.json()
        setProfileData((prevProfile) => {
          if (!prevProfile) return null
          return {
            ...prevProfile,
            isFollowing: result.following,
            followersCount: prevProfile.followersCount + (result.following ? 1 : -1),
          }
        })
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    }
  }
  
  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!session?.user) return
    
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })
      
      if (response.ok) {
        const result = await response.json()
        const updatePosts = (postsList: Post[]) =>
          postsList.map((post) =>
            post._id === postId ? { ...post, isLiked: result.liked, likesCount: post.likesCount + (result.liked ? 1 : -1) } :
            post,
          )
        
        setPosts(updatePosts(posts))
        setReplies(updatePosts(replies))
        setReposts(updatePosts(reposts))
        setMedia(updatePosts(media))
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }
  
  const handleRepost = async (postId: string, isReposted: boolean) => {
    if (!session?.user) return
    
    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
      })
      
      if (response.ok) {
        const result = await response.json()
        // If a repost was created/deleted, we need to refetch reposts or update state carefully.
        // For simplicity, let's refetch all profile data to ensure counts are accurate.
        fetchProfileData()
      }
    } catch (error) {
      console.error("Error toggling repost:", error)
    }
  }
  
  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }
  
  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center font-english">
        {" "}
        {/* Changed to font-english */}
        <div className="text-center">
          <p className="text-xl mb-4">Profile not found</p>
          <Link href="/">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  const isOwnProfile = profileData._id === currentUser?._id
  
  const renderTabContent = (tabPosts: Post[], emptyMessage: string) => (
    <div>
      {tabPosts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        tabPosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={handleLike}
            onRepost={handleRepost}
            onReply={fetchProfileData} // Trigger a refetch on reply/post update
          />
        ))
      )}
    </div>
  )
  
  return (
    <div className="min-h-screen bg-gray-50 font-english">
      {" "}
      {/* Changed to font-english */}
      
      
      <Header profile = {profileData} handleSignOut = {handleSignOut}/>
      
      
      <div className="flex">
        {/* Sidebar - only show if logged in */}
        

        {/* Main content */}
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="border-x bg-white min-h-screen">
            <div className="sticky top-0 bg-white/50 z-30 backdrop-blur-md border-b px-4 py-3">
              <h2 className="text-xl font-bold">{profileData.displayName}</h2>
              <p className="text-sm text-gray-500">{profileData.postsCount} posts</p>
            </div>

            {/* Cover Image */}
            <div className="relative">
              <div
                className="w-full h-48 bg-gradient-to-r from-blue-400 to-purple-500"
                style={{
                  backgroundImage: profileData.bannerUrl ? `url(${profileData.bannerUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>

            {/* Profile Header */}
            <div className="p-4 border-b relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col items-center justify-center">
                  <Avatar className="w-20 h-20 -mt-10 border-4 border-white" onClick = {()=>{
                    setImageViewerOpen(true)
                  }}>
                    <AvatarImage src={profileData.avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl">
                      {profileData.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {profileData.isVerified && (
                    <VerificationBadge verified={true} size={20} className="h-8 w-8 z-10 -mt-4 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button variant="outline"
                    className='rounded-full'
                    onClick={() => setEditDialogOpen(true)}>
                      Edit Profile
                    </Button>
                  ) : session?.user ? (
                    <>
                      <Button className='rounded-full' variant="outline">Message</Button>
                      <Button
                      className='rounded-full'
                      variant={profileData.isFollowing ? "outline" : "default"} onClick={handleFollow}>
                        {profileData.isFollowing ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Link href="/auth/sign-in">
                      <Button className='rounded-full'>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold flex items-center gap-2">
                  {profileData.displayName}
                  <p className="text-gray-500 text-sm">@{profileData.username}</p>
                </h1>

                {profileData.bio && <p className="text-gray-900">{profileData.bio}</p>}

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {profileData.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profileData.location}
                    </div>
                  )}
                  {profileData.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      <a
                        href={profileData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profileData.website}
                      </a>
                      
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDistanceToNow(new Date(profileData.createdAt), { addSuffix: true })} joined
                  </div>
                </div>

                <div className="flex gap-4 text-sm">
                  <span>
                    <strong>{profileData.followingCount}</strong> following
                  </span>
                  <span>
                    <strong>{profileData.followersCount}</strong> followers
                  </span>
                </div>
              </div>
             <MutualFollowers targetUsername={profileData.username}/>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white rounded-none h-12">
                <TabsTrigger
                  value="posts"
                  className="data-[state=active]:border-b-2 font-racing w-full pb-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  Posts
                </TabsTrigger>
                <TabsTrigger
                  value="replies"
                  className="data-[state=active]:border-b-2 w-full pb-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  Replies
                </TabsTrigger>
                <TabsTrigger
                  value="reposts"
                  className="data-[state=active]:border-b-2 w-full pb-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  Reposts
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="data-[state=active]:border-b-2 w-full pb-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  Media
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-0">
                {renderTabContent(posts, "No posts yet")}
              </TabsContent>

              <TabsContent value="replies" className="mt-0">
                {renderTabContent(replies, "No replies yet")}
              </TabsContent>

              <TabsContent value="reposts" className="mt-0">
                {renderTabContent(reposts, "No reposts yet")}
              </TabsContent>

              <TabsContent value="media" className="mt-0">
                {renderTabContent(media, "No media yet")}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Edit Profile Dialog */}
      {isOwnProfile && (
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profileData}
          onProfileUpdate={(updatedProfile) => {
            setProfileData((prevProfile) => {
              if (!prevProfile) return null
              return { ...prevProfile, ...updatedProfile }
            })
            if (currentUser) {
              setCurrentUser((prevUser: any) => ({ ...prevUser, ...updatedProfile }))
            }
          }}
        />
      )}
      {/* Image Viewer */}
      {imageViewerOpen && (
        <ImageViewer
          src={profileData.avatarUrl || "/placeholder.svg"}
          isOpen={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </div>
  )
}