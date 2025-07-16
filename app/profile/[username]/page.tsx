"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  CalendarDays,
  LinkIcon,
  MapPin,
  ArrowLeft,
  UserPlus,
  UserCheck,
  MessageCircle,
  Edit,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { PostCard } from "@/components/dashboard/post-card"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { VerificationBadge } from "@/components/badge/verification-badge"
import Loader from "@/components/loader/loader" // Updated import path

interface UserProfile {
  _id: string
  username: string
  displayName: string
  bio: string | null
  location: string | null
  website: string | null
  avatarUrl: string | null
  coverPhotoUrl: string | null
  createdAt: string
  followersCount: number
  followingCount: number
  postsCount: number
  isFollowing: boolean
  isVerified: boolean
}

interface Post {
  _id: string
  content: string
  createdAt: string
  authorId: string
  author: {
    _id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isVerified: boolean
  }
  likesCount: number
  repostsCount: number
  repliesCount: number
  isLiked: boolean
  isReposted: boolean
  mediaUrls: string[] | null
  mediaType: string | null
  isPinned: boolean
  repostedBy?: string
}

interface ProfileContentProps {
  username: string
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [replies, setReplies] = useState<Post[]>([])
  const [mediaPosts, setMediaPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowingAction, setIsFollowingAction] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentUserId = session?.user?.id

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const profileResponse = await fetch(`/api/users/${params.username}`)
      if (!profileResponse.ok) {
        if (profileResponse.status === 404) {
          setError("User not found")
        } else {
          throw new Error("Failed to fetch profile")
        }
        setProfile(null)
        setIsLoading(false)
        return
      }
      const profileData = await profileResponse.json()
      setProfile(profileData)

      // Fetch posts, replies, media, and likes concurrently
      const [postsRes, repliesRes, mediaRes, likedRes] = await Promise.all([
        fetch(`/api/users/${params.username}/posts`),
        fetch(`/api/users/${params.username}/replies`),
        fetch(`/api/users/${params.username}/media`),
        fetch(`/api/users/${params.username}/likes`),
      ])

      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setPosts(postsData)
      }
      if (repliesRes.ok) {
        const repliesData = await repliesRes.json()
        setReplies(repliesData)
      }
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json()
        setMediaPosts(mediaData)
      }
      if (likedRes.ok) {
        const likedData = await likedRes.json()
        setLikedPosts(likedData)
      }
    } catch (err) {
      console.error("Error fetching profile data:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [params.username])

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  const handleFollow = async () => {
    if (!profile || !currentUserId || isFollowingAction) return

    setIsFollowingAction(true)
    try {
      const action = profile.isFollowing ? "unfollow" : "follow"
      const response = await fetch(`/api/users/${profile._id}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const result = await response.json()
        setProfile((prev) => {
          if (!prev) return null
          return {
            ...prev,
            isFollowing: result.following,
            followersCount: prev.followersCount + (result.following ? 1 : -1),
          }
        })
      } else {
        throw new Error("Failed to update follow status")
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
      setError("Failed to update follow status.")
    } finally {
      setIsFollowingAction(false)
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !isLiked }),
      })
      if (!response.ok) throw new Error("Failed to toggle like")
      fetchProfileData() // Re-fetch data to update counts and liked status
    } catch (error) {
      console.error("Error toggling like:", error)
      setError("Failed to update like status.")
    }
  }

  const handleRepost = async (postId: string, isReposted: boolean) => {
    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reposted: !isReposted }),
      })
      if (!response.ok) throw new Error("Failed to toggle repost")
      fetchProfileData() // Re-fetch data to update counts and reposted status
    } catch (error) {
      console.error("Error toggling repost:", error)
      setError("Failed to update repost status.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {error === "User not found" ? "User not found" : "Something went wrong"}
          </h2>
          <p className="text-gray-500 mb-4">
            {error === "User not found"
              ? "The profile you are looking for does not exist."
              : error || "Failed to load profile data."}
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const isCurrentUserProfile = currentUserId === profile._id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 z-50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">{profile.displayName}</h1>
          <span className="text-sm text-gray-500">{profile.postsCount} posts</span>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto bg-white border-x">
        {/* Cover Photo */}
        <div className="relative h-40 w-full bg-gray-200">
          {profile.coverPhotoUrl && (
            <img
              src={profile.coverPhotoUrl || "/placeholder.svg"}
              alt="Cover Photo"
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg"
              }}
            />
          )}
        </div>

        {/* Avatar and Actions */}
        <div className="relative p-4">
          <Avatar className="absolute -top-16 left-4 h-32 w-32 border-4 border-white">
            <AvatarImage src={profile.avatarUrl || undefined} alt={`${profile.displayName}'s avatar`} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl">
              {profile.displayName?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex justify-end gap-2">
            {isCurrentUserProfile ? (
              <Button
                variant="outline"
                className="rounded-full px-4 bg-transparent"
                onClick={() => setEditProfileOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Button
                  variant={profile.isFollowing ? "outline" : "default"}
                  className="rounded-full px-4"
                  onClick={handleFollow}
                  disabled={isFollowingAction}
                >
                  {isFollowingAction ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : profile.isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Profile Info */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{profile.displayName}</h2>
              {profile.isVerified && <VerificationBadge verified={true} size={24} className="h-6 w-6" />}
            </div>
            <p className="text-gray-500 text-sm">@{profile.username}</p>

            {profile.bio && <p className="mt-3 text-gray-800">{profile.bio}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 text-sm">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="h-4 w-4" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {profile.website.replace(/^(https?:\/\/)?(www\.)?/, "")}
                  </a>
                </div>
              )}
              {profile.createdAt && (
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>Joined {format(new Date(profile.createdAt), "MMM yyyy")}</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-4 text-sm">
              <Link href={`/profile/${profile.username}/following`} className="hover:underline">
                <span className="font-bold">{profile.followingCount}</span>{" "}
                <span className="text-gray-500">Following</span>
              </Link>
              <Link href={`/profile/${profile.username}/followers`} className="hover:underline">
                <span className="font-bold">{profile.followersCount}</span>{" "}
                <span className="text-gray-500">Followers</span>
              </Link>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Tabs for Posts, Replies, Media, Likes */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="replies">Replies</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="likes">Likes</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onReply={fetchProfileData} // Refresh profile data after reply/update
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No posts yet.</div>
              )}
            </TabsContent>

            <TabsContent value="replies" className="mt-4">
              {replies.length > 0 ? (
                replies.map((reply) => (
                  <PostCard
                    key={reply._id}
                    post={reply}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onReply={fetchProfileData}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No replies yet.</div>
              )}
            </TabsContent>

            <TabsContent value="media" className="mt-4">
              {mediaPosts.length > 0 ? (
                mediaPosts.map((mediaPost) => (
                  <PostCard
                    key={mediaPost._id}
                    post={mediaPost}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onReply={fetchProfileData}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No media posts yet.</div>
              )}
            </TabsContent>

            <TabsContent value="likes" className="mt-4">
              {likedPosts.length > 0 ? (
                likedPosts.map((likedPost) => (
                  <PostCard
                    key={likedPost._id}
                    post={likedPost}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onReply={fetchProfileData}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No liked posts yet.</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {isCurrentUserProfile && profile && (
        <EditProfileDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          profile={profile}
          onProfileUpdated={fetchProfileData}
        />
      )}
    </div>
  )
}
