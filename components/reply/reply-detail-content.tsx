"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/loader/spinner" // Updated import path
import { PostCard } from "@/components/dashboard/post-card"
import { CreatePost } from "@/components/dashboard/create-post"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface ReplyDetailContentProps {
  replyId: string
  userId: string
}

export function ReplyDetailContent({ replyId, userId }: ReplyDetailContentProps) {
  const [reply, setReply] = useState<any>(null)
  const [parentPost, setParentPost] = useState<any>(null)
  const [subReplies, setSubReplies] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchReplyAndContext()
    fetchCurrentUser()
  }, [replyId, userId])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`/api/users/current`)
      if (!response.ok) throw new Error("Failed to fetch current user")
      const data = await response.json()
      setCurrentUser(data)
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const fetchReplyAndContext = async () => {
    try {
      setIsLoading(true)

      // Fetch the reply
      const replyResponse = await fetch(`/api/posts/${replyId}`)
      if (!replyResponse.ok) throw new Error("Failed to fetch reply")
      const replyData = await replyResponse.json()
      setReply(replyData)

      // Fetch parent post if this is a reply
      if (replyData.replyTo) {
        const parentResponse = await fetch(`/api/posts/${replyData.replyTo}`)
        if (!parentResponse.ok) throw new Error("Failed to fetch parent post")
        const parentData = await parentResponse.json()
        setParentPost(parentData)
      }

      // Fetch sub-replies
      const subRepliesResponse = await fetch(`/api/posts/${replyId}/replies`)
      if (!subRepliesResponse.ok) throw new Error("Failed to fetch sub-replies")
      const subRepliesData = await subRepliesResponse.json()
      setSubReplies(subRepliesData)
    } catch (error) {
      console.error("Error fetching reply and context:", error)
    } finally {
      setIsLoading(false)
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
      fetchReplyAndContext()
    } catch (error) {
      console.error("Error toggling like:", error)
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
      fetchReplyAndContext()
    } catch (error) {
      console.error("Error toggling repost:", error)
    }
  }

  const handleReplyCreated = () => {
    fetchReplyAndContext()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!reply) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Reply not found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto border-x">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Reply</h1>
        </div>

        {/* Parent Post (if exists) */}
        {parentPost && (
          <div className="border-b bg-gray-50">
            <div className="p-4 text-sm text-gray-600">
              Replying to <span className="text-blue-600">@{parentPost.username}</span>
            </div>
            <PostCard
              post={parentPost}
              currentUserId={userId}
              currentUser={currentUser}
              onLike={handleLike}
              onRepost={handleRepost}
              onReply={handleReplyCreated}
            />
          </div>
        )}

        {/* Main Reply */}
        <PostCard
          post={reply}
          currentUserId={userId}
          currentUser={currentUser}
          onLike={handleLike}
          onRepost={handleRepost}
          onReply={handleReplyCreated}
        />

        {/* Reply Form */}
        {currentUser && (
          <div className="border-b">
            <CreatePost userId={userId} replyTo={replyId} onPostCreated={handleReplyCreated} />
          </div>
        )}

        {/* Sub-replies */}
        <div className="divide-y">
          {subReplies.map((subReply) => (
            <PostCard
              key={subReply._id} // Use _id for MongoDB documents
              post={subReply}
              currentUserId={userId}
              currentUser={currentUser}
              onLike={handleLike}
              onRepost={handleRepost}
              onReply={handleReplyCreated}
            />
          ))}
        </div>

        {subReplies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No replies yet. Be the first to reply!</p>
          </div>
        )}
      </div>
    </div>
  )
}
