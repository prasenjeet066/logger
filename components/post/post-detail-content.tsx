"use client"

import { useState, useEffect, useRef } from "react"

import { ReplyCard } from "@/components/reply/reply-card"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/loader/spinner"
import { PostSection } from "@/components/post/post-section"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Paperclip } from "lucide-react"
import Image from "next/image"
import { fetchCurrentUser } from "@/store/slices/authSlice"
import { useAppDispatch, useAppSelector } from "@/store/main"

interface PostDetailContentProps {
  postId: string
  userId: string
}

interface Post {
  _id: string
  content: string
  authorId: string
  author: {
    _id: string
    username: string
    displayName: string
    avatarUrl?: string
    isVerified: boolean
  }
  mediaUrls?: string[]
  mediaType?: "image" | "video" | "gif"
  likesCount: number
  repostsCount: number
  repliesCount: number
  isRepost: boolean
  originalPostId?: string
  parentPostId?: string
  hashtags: string[]
  mentions: string[]
  isPinned: boolean
  createdAt: string
  updatedAt: string
  isLiked?: boolean
  isReposted?: boolean
}

interface Reply extends Post {
  parentPost?: Post
}

type CommentState = {
  text: string
  replyingTo: string | null
  replyParentId: string | null
}

export function PostDetailContent({ postId, userId }: PostDetailContentProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [headerTitle, setHeaderTitle] = useState("Post")
  
  const router = useRouter()
  const dispatch = useAppDispatch()
  const authState = useAppSelector((state) => state.auth)
  const { currentUser = null } = authState || {}
  
  const commentHeaderRef = useRef<HTMLDivElement | null>(null)

  const [commentState, setCommentState] = useState<CommentState>({
    text: "",
    replyingTo: null,
    replyParentId: postId,
  })

  // IntersectionObserver effect for header title
  useEffect(() => {
    if (!commentHeaderRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHeaderTitle("Post")
          } else {
            setHeaderTitle("Comments")
          }
        })
      },
      {
        root: null, // viewport
        threshold: 0.1, // adjust if you want earlier/later trigger
      }
    )

    observer.observe(commentHeaderRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Main data fetching effect
  useEffect(() => {
    const fetchCurrentUserData = async () => {
      try {
        dispatch(fetchCurrentUser())
      } catch (e) {
        console.error('Error fetching current user:', e)
        setError(e instanceof Error ? e.message : 'Failed to fetch user data')
      }
    }

    fetchPostAndReplies()
    updateWatch()
    
    // Reset comment state when postId changes
    setCommentState({
      text: "",
      replyingTo: null,
      replyParentId: postId,
    })
    
    fetchCurrentUserData()
  }, [postId, userId, dispatch])
  
  const updateWatch = async () => {
    try {
      const response = await fetch('/api/viewUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'postId': postId })
      })
      
      if (!response.ok) {
        console.warn('Failed to update view count:', response.statusText)
      }
    } catch (error) {
      console.warn('Error updating view count:', error)
      // Don't set this as a critical error since it's not essential
    }
  }

  const fetchPostAndReplies = async () => {
    try {
      setError(null)

      // Fetch main post
      const postResponse = await fetch(`/api/posts/${postId}`)
      if (!postResponse.ok) {
        if (postResponse.status === 404) {
          setError("Post not found")
        } else {
          throw new Error("Failed to fetch post")
        }
        setPost(null)
        return
      }

      const postData = await postResponse.json()
      setPost(postData)

      // Fetch replies
      const repliesResponse = await fetch(`/api/posts/${postId}/replies`)
      if (!repliesResponse.ok) {
        console.warn("Failed to fetch replies")
        setReplies([])
        return
      }

      const repliesData = await repliesResponse.json()
      setReplies(Array.isArray(repliesData) ? repliesData : [])
    } catch (error) {
      console.error("Error fetching post and replies:", error)
      setError("Failed to load post data")
      setPost(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePostComment = async () => {
    if (!commentState.text.trim() || isPosting) return
    
    // Validate required data
    if (!currentUser) {
      setError("User session not found. Please refresh and try again.")
      return
    }

    setIsPosting(true)
    try {
      const requestBody = {
        content: commentState.text,
        parentPostId: commentState.replyParentId,
        authorId: currentUser._id,
        // Add default values to prevent API errors
        mediaUrls: [],
        mediaType: null,
        hashtags: [],
        mentions: [],
        visibility: "public"
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to post comment`)
      }

      const result = await response.json()
      console.log("Comment posted successfully:", result)

      // Reset comment box and refresh replies
      setCommentState({
        text: "",
        replyingTo: null,
        replyParentId: postId,
      })
      
      // Refresh the post and replies data
      await fetchPostAndReplies()
      
    } catch (error) {
      console.error("Error posting comment:", error)
      setError(error instanceof Error ? error.message : "Failed to post comment")
    } finally {
      setIsPosting(false)
    }
  }

  const handleLike = async (id: string, isLiked: boolean) => {
    try {
      const response = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !isLiked }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to toggle like")
      }

      await fetchPostAndReplies()
    } catch (error) {
      console.error("Error toggling like:", error)
      setError("Failed to update like")
    }
  }

  const handleRepost = async (id: string, isReposted: boolean) => {
    try {
      const response = await fetch(`/api/posts/${id}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reposted: !isReposted }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to toggle repost")
      }

      await fetchPostAndReplies()
    } catch (error) {
      console.error("Error toggling repost:", error)
      setError("Failed to update repost")
    }
  }

  const handleReplyCreated = (reply?: Reply) => {
    if (reply) {
      // Set reply state to reply to this reply
      setCommentState({
        text: "",
        replyingTo: reply.author.username,
        replyParentId: reply._id,
      })
      router.push(`/post/${reply._id}`)
    } else {
      // Replying to main post
      setCommentState({
        text: "",
        replyingTo: post?.author.username || null,
        replyParentId: postId,
      })
    }
  }

  // Helper: render the reply input box
  const renderReplyInput = () => (
    <div className="flex items-center gap-2 px-4 py-3 box-border w-full border-b">
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
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm font-medium">
            {currentUser?.displayName?.charAt(0)?.toUpperCase() || "U"}
          </span>
        </div>
      )}

      {/* Input container */}
      <div className="flex-1 flex items-center border rounded-full px-3 py-1">
        <input
          type="text"
          value={commentState.text}
          onChange={(e) => setCommentState((prev) => ({ ...prev, text: e.target.value }))}
          placeholder={commentState.replyingTo ? `Replying to @${commentState.replyingTo}...` : "Write a reply..."}
          className="bg-transparent w-full outline-none px-2 py-1 text-sm"
          disabled={isPosting}
          autoFocus
          maxLength={280}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && commentState.text.trim()) {
              e.preventDefault()
              handlePostComment()
            }
          }}
        />
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 flex items-center ml-2"
          tabIndex={-1}
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
      </div>

      <Button
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!commentState.text.trim() || isPosting}
        onClick={handlePostComment}
      >
        {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reply"}
      </Button>
    </div>
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {error === "Post not found" ? "Post not found" : "Something went wrong"}
          </h2>
          <p className="text-gray-500 mb-4">
            {error === "Post not found"
              ? "This post may have been deleted or doesn't exist."
              : error || "Failed to load post data"}
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto border-x min-h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-4 py-3 z-50 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold">{headerTitle}</h1>
            <span className="text-xs text-gray-500">
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </span>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)} 
                className="ml-auto text-red-400 hover:text-red-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Main Post */}
        <PostSection
          post={post}
          currentUserId={userId}
          currentUser={currentUser}
          onLike={handleLike}
          onRepost={handleRepost}
          onReply={() => handleReplyCreated()}
        />

        {/* Reply Input - Always show at top */}
        {!commentState.replyingTo && renderReplyInput()}
        
        <div ref={commentHeaderRef} className='text-md px-4 py-3 flex flex-row items-center justify-between'>
          <>
          {`${replies.length} ${replies.length === 1 ? 'Comment' : 'Comments'}`}</>
          
        </div>
        
        {/* Replies Section */}
        <div className="divide-y ease-in">
          {replies.length > 0 ? (
            replies.map((reply) => (
              <div key={reply._id}>
                <ReplyCard
                  post={reply}
                  currentUserId={userId}
                  currentUser={currentUser}
                  onLike={handleLike}
                  onRepost={handleRepost}
                />
                {/* Show reply input under the reply if replying to it */}
                {commentState.replyParentId === reply._id && renderReplyInput()}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium">No replies yet</p>
              <p className="text-sm">Be the first to reply to this post!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}