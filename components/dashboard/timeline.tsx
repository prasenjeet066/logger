"use client"

import { useEffect, useState } from "react"
import { Spinner } from "@/components/loader/spinner"
import { PostCard } from "./post-card"
import { useMobile } from "@/hooks/use-mobile"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Post {
  _id: string
  content: string
  authorId: string
  createdAt: string
  likesCount: number
  repliesCount: number
  repostsCount: number
  viewsCount: number
  mediaUrls ? : string[]
  mediaType ? : "image" | "video" | "gif"
  isRepost: boolean
  originalPostId ? : string
  parentPostId ? : string
  hashtags: string[]
  mentions: string[]
  isPinned: boolean
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl ? : string
    isVerified: boolean
    isFollowing: boolean
  }
  isLiked: boolean
  isReposted: boolean
  repostedBy ? : string
}

export function Timeline({ userId, typesOfAlg }: { userId: string;typesOfAlg: string }) {
  const [posts, setPosts] = useState < Post[] > ([])
  const [loading, setLoading] = useState(true)
  const [loadingPost, setLoadingPost] = useState(true)
  const [error, setError] = useState < string | null > (null)
  const [currentAlg, setCurrentAlg] = useState(typesOfAlg || "algorithmic")
  
  const isMobile = useMobile()
  
  useEffect(() => {
    fetchPosts()
  }, [currentAlg])
  
  const fetchPosts = async () => {
    try {
      setLoadingPost(true)
      const response = await fetch(`/api/alg?algorithm=${currentAlg}`)
      if (!response.ok) throw new Error("Failed to fetch posts")
      
      const timelineData = await response.json()
      setPosts(timelineData.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
      setLoadingPost(false)
    }
  }
  
  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to toggle like")
      const result = await res.json()
      
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ?
          {
            ...p,
            isLiked: result.liked,
            likesCount: p.likesCount + (result.liked ? 1 : -1),
          } :
          p,
        ),
      )
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }
  
  const handleRepost = async (postId: string, isReposted: boolean) => {
    try {
      const res = await fetch(`/api/posts/${postId}/repost`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to toggle repost")
      const result = await res.json()
      
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ?
          {
            ...p,
            isReposted: result.reposted,
            repostsCount: p.repostsCount + (result.reposted ? 1 : -1),
          } :
          p,
        ),
      )
    } catch (error) {
      console.error("Error toggling repost:", error)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner withLabel={false} />
      </div>
    )
  }
  
  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>
  }
  
  const algorithmTabs = [
    { name: "For You", alg: "algorithmic" },
    { name: "Trending", alg: "trending" },
    { name: "Most Recent", alg: "chronological" },
  ]
  
  return (
    <div className="w-full">
      <Tabs
        value={currentAlg}
        onValueChange={(val) => setCurrentAlg(val)}
        className="w-full"
      >
        <TabsList
          className={`w-full flex ${isMobile ? "justify-between px-4 border-b" : "justify-start gap-4 mb-4"}`}
        >
          {algorithmTabs.map((tab) => (
            <TabsTrigger
              key={tab.alg}
              value={tab.alg}
              className="text-xs sm:text-sm data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600"
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {algorithmTabs.map((tab) => (
          <TabsContent key={tab.alg} value={tab.alg}>
            {loadingPost ? (
              <div className="flex justify-center items-center py-8">
                <Spinner />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No posts yet. Be the first to post!
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onRepost={handleRepost}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}