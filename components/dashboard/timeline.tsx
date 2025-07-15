"use client"

import { useEffect, useState } from "react"
import { PostCard } from "./post-card"
import { Spinner } from "@/components/spinner"

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
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
    isVerified: boolean
  }
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

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post)))
  }

  const handleNewPost = (newPost: Post) => {
    setPosts((prevPosts) => [newPost, ...prevPosts])
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
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
        <PostCard key={post._id} post={post} onUpdate={handlePostUpdate} />
      ))}
    </div>
  )
}
