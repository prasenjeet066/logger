"use client"

import { useEffect, useState } from "react"
import { PostCard } from "./post-card"
import Loader from "@/components/loader/loader" // Updated import path

interface Post {
  _id: string
  content: string
  authorId: string
  createdAt: string
  likesCount: number
  repliesCount: number
  repostsCount: number
  viewsCount: number
  mediaUrls?: string[]
  mediaType?: "image" | "video" | "gif"
  isRepost: boolean
  originalPostId?: string
  parentPostId?: string
  hashtags: string[]
  mentions: string[]
  isPinned: boolean
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
    isVerified: boolean
  }
  isLiked: boolean
  isReposted: boolean
  repostedBy?: string
}

export function Timeline() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/posts")

      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }

      const data = await response.json()
      setPosts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to toggle like")
      }
      const result = await response.json()
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, isLiked: result.liked, likesCount: post.likesCount + (result.liked ? 1 : -1) }
            : post,
        ),
      )
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleRepost = async (postId: string, isReposted: boolean) => {
    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to toggle repost")
      }
      const result = await response.json()
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, isReposted: result.reposted, repostsCount: post.repostsCount + (result.reposted ? 1 : -1) }
            : post,
        ),
      )
    } catch (error) {
      console.error("Error toggling repost:", error)
    }
  }

  // No longer need handlePostUpdate or handleNewPost here as PostCard handles its own state updates
  // and Timeline fetches all posts.

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader />
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>
  }

  if (posts.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No posts yet. Be the first to post!</div>
  }

  return (
    <div className="space-y-0">
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onLike={handleLike}
          onRepost={handleRepost}
          // onReply is not directly handled by Timeline, but by PostCard itself
        />
      ))}
    </div>
  )
}
