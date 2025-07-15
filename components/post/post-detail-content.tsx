"use client"

import { useState, useEffect } from "react"
import { ReplyCard } from "@/components/reply/reply-card"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/loader/spinner" // Updated import path
import { PostSection } from "@/components/post/post-section"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Paperclip } from "lucide-react"
import Image from "next/image"

interface PostDetailContentProps {
  postId: string
  userId: string
}

type CommentState = {
  text: string
  replyingTo: string | null // username or null
  replyParentId: string | null // postId or replyId
}

export function PostDetailContent({ postId, userId }: PostDetailContentProps) {
  const [post, setPost] = useState<any>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [commentState, setCommentState] = useState<CommentState>({
    text: "",
    replyingTo: null,
    replyParentId: postId, // by default, reply to the main post
  })
  const [isPosting, setIsPosting] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
    fetchPostAndReplies()

    // Reset comment state when postId changes
    setCommentState({
      text: "",
      replyingTo: null,
      replyParentId: postId,
    })
  }, [postId, userId])
  /**
  const setNewViewUpdate = async (data) =>{
    try{
      if(userId !== null){
      const {error} = await supabase.from('posts').update({
        views_count : post.views_count + 1
      }).eq("id",postId)
      }
    }catch(error){
      // error
    }
  }**/
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

  const handlePostComment = async () => {
    if (!commentState.text.trim() || isPosting) return

    setIsPosting(true)
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentState.text,
          replyTo: commentState.replyParentId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to post comment")
      }

      // Reset comment box and refresh replies
      setCommentState({ text: "", replyingTo: null, replyParentId: postId })
      await fetchPostAndReplies()
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setIsPosting(false)
    }
  }

  const fetchPostAndReplies = async () => {
    try {
      setIsLoading(true)

      // Fetch main post
      const postResponse = await fetch(`/api/posts/${postId}`)
      if (!postResponse.ok) {
        setPost(null)
        setIsLoading(false)
        return
      }
      const postData = await postResponse.json()
      setPost(postData)

      // Fetch replies
      const repliesResponse = await fetch(`/api/posts/${postId}/replies`)
      if (!repliesResponse.ok) {
        setReplies([])
        return
      }
      const repliesData = await repliesResponse.json()
      setReplies(repliesData)
    } catch (error) {
      console.error("Error fetching post and replies:", error)
      setPost(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async (id: string, isLiked: boolean) => {
    try {
      const response = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !isLiked }),
      })
      if (!response.ok) throw new Error("Failed to toggle like")
      fetchPostAndReplies()
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleRepost = async (id: string, isReposted: boolean) => {
    try {
      const response = await fetch(`/api/posts/${id}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reposted: !isReposted }),
      })
      if (!response.ok) throw new Error("Failed to toggle repost")
      fetchPostAndReplies()
    } catch (error) {
      console.error("Error toggling repost:", error)
    }
  }

  // Handle clicking "Reply" on a post or reply
  const handleReplyCreated = (reply?: any) => {
    if (reply) {
      // Set reply state to reply to this reply
      setCommentState({
        text: "",
        replyingTo: reply.username,
        replyParentId: reply.id,
      })
      router.push(`/post/${reply.id}`)
    } else {
      // Replying to main post
      setCommentState({
        text: "",
        replyingTo: post.username,
        replyParentId: postId,
      })
    }
  }

  // UI rendering
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Post not found</h2>
          <p className="text-gray-500 mb-4">This post may have been deleted or doesn't exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  // Helper: render the reply input box
  const renderReplyInput = () => (
    <div className="flex items-center gap-2 px-4 py-3 box-border w-full">
      {/* Avatar */}
      {currentUser?.avatarUrl ? (
        <Image
          src={currentUser.avatarUrl || "/placeholder.svg"}
          alt={currentUser.displayName || "User"}
          width={35}
          height={35}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200" />
      )}

      {/* Input container */}
      <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-1">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={commentState.text}
            onChange={(e) => setCommentState((prev) => ({ ...prev, text: e.target.value }))}
            placeholder={commentState.replyingTo ? `Replying to @${commentState.replyingTo}...` : "Write a reply..."}
            className="bg-transparent w-full outline-none px-2 py-1"
            disabled={isPosting}
            autoFocus
          />
        </div>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 flex items-center ml-2"
          tabIndex={-1}
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
      </div>

      <Button
        className="bg-gray-800 text-white rounded-full"
        disabled={!commentState.text.trim() || isPosting}
        onClick={handlePostComment}
      >
        {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto border-x">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 z-50 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold">{post.displayName}</h1>
            <small>{replies.length} replies</small>
          </div>
        </div>
        {/* Main Post */}
        <PostSection
          post={post}
          currentUserId={userId}
          currentUser={currentUser}
          onLike={handleLike}
          onRepost={handleRepost}
          onReply={() => handleReplyCreated()}
        />

        {/* Replies */}
        <div className="divide-y">
          <h3 className="my-2 px-4">Comments</h3>
          {/* Comment Box: Only show if not replying to a specific reply */}
          {!commentState.replyingTo && renderReplyInput()}
          {replies.map((reply) => (
            <div key={reply.id}>
              <ReplyCard
                post={reply}
                currentUserId={userId}
                currentUser={currentUser}
                onLike={handleLike}
                onRepost={handleRepost}
              />
              {/* Show reply input under the reply if replying to it */}
              {commentState.replyParentId === reply.id && renderReplyInput()}
            </div>
          ))}
        </div>
        {replies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No replies yet. Be the first to reply!</p>
          </div>
        )}
      </div>
    </div>
  )
}
