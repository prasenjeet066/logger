"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, Languages, Repeat2, Share, Pin, AlertCircle } from "lucide-react"
import Link from "next/link"
import { PostActionsMenu } from "./post-actions-menu"
import { VerificationBadge } from "@/components/badge/verification-badge"
import LinkPreview from "@/components/link-preview"
import DOMPurify from "dompurify"
import { useRouter, usePathname } from "next/navigation"
import type { Post } from "@/types/post"
import { useSession } from "next-auth/react" // Import useSession

interface PostCardProps {
  post: Post
  // currentUserId: string // No longer needed, get from session
  // currentUser: any // No longer needed, get from session
  onLike: (postId: string, isLiked: boolean) => void
  onRepost: (postId: string, isReposted: boolean) => void
  onReply?: () => void
}

interface TranslationState {
  isTranslating: boolean
  translatedText: string | null
  originalText: string
  targetLang: string
  error: string | null
}

// Utility functions
const extractFirstUrl = (text: string): string | null => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const match = text.match(urlRegex)
  return match ? match[0] : null
}

const smartTruncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text

  // Try to break at sentence boundary
  const sentences = text.match(/[^.!?]+[.!?]+/g)
  if (sentences) {
    let truncated = ""
    for (const sentence of sentences) {
      if ((truncated + sentence).length > maxLength) break
      truncated += sentence
    }
    if (truncated.length > 0) return truncated.trim() + "..."
  }

  // Fallback to word boundary
  const words = text.split(" ")
  let truncated = ""
  for (const word of words) {
    if ((truncated + word + " ").length > maxLength) break
    truncated += word + " "
  }

  return truncated.trim() + "..."
}

export function PostCard({ post, onLike, onRepost, onReply }: PostCardProps) {
  const { data: session } = useSession() // Get session
  const currentUserId = session?.user?.id // Extract current user ID

  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [repostLoading, setRepostLoading] = useState(false)
  const [translation, setTranslation] = useState<TranslationState>({
    isTranslating: false,
    translatedText: null,
    originalText: post.content,
    targetLang: "bn",
    error: null,
  })

  const router = useRouter()
  const pathname = usePathname()

  // Memoized values
  const postUrl = useMemo(() => extractFirstUrl(post.content), [post.content])
  const hasMedia = useMemo(() => post.mediaUrls && post.mediaUrls.length > 0, [post.mediaUrls]) // Changed from media_urls
  const isPostPage = useMemo(() => pathname.startsWith("/post"), [pathname])

  const MAX_LENGTH = 100
  const shouldTrim = !isPostPage && post.content.length > MAX_LENGTH
  const displayContent = shouldTrim ? smartTruncate(post.content, MAX_LENGTH) : post.content

  // Translation function with better error handling
  const translateText = useCallback(async (text: string, targetLang = "bn"): Promise<string> => {
    try {
      const res = await fetch("https://libretranslate.com/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "auto",
          target: targetLang,
          format: "text",
        }),
      })

      if (!res.ok) {
        throw new Error(`Translation failed: ${res.status}`)
      }

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      return data.translatedText || text
    } catch (error) {
      console.error("Translation error:", error)
      throw new Error("Translation service unavailable")
    }
  }, [])

  // Enhanced content formatting with better security
  const formatContent = useCallback((content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g

    // Sanitize content first
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    })

    return sanitizedContent
      .replace(
        urlRegex,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline break-all hover:text-blue-800 transition-colors">$1</a>',
      )
      .replace(
        /#([a-zA-Z0-9_\u0980-\u09FF]+)/g,
        '<span class="text-blue-600 hover:underline cursor-pointer font-medium transition-colors">#$1</span>',
      )
      .replace(
        /@([a-zA-Z0-9_]+)/g,
        '<span class="text-blue-600 hover:underline cursor-pointer font-medium transition-colors">@$1</span>',
      )
  }, [])

  // Enhanced translation handler
  const handlePostTranslate = useCallback(async () => {
    if (translation.isTranslating) return

    setTranslation((prev) => ({
      ...prev,
      isTranslating: true,
      error: null,
    }))

    try {
      const translatedText = await translateText(post.content, translation.targetLang)
      setTranslation((prev) => ({
        ...prev,
        isTranslating: false,
        translatedText,
        error: null,
      }))
    } catch (error) {
      setTranslation((prev) => ({
        ...prev,
        isTranslating: false,
        error: error instanceof Error ? error.message : "Translation failed",
      }))
    }
  }, [post.content, translation.targetLang, translation.isTranslating, translateText])

  // Toggle between original and translated text
  const handleToggleTranslation = useCallback(() => {
    if (translation.translatedText) {
      setTranslation((prev) => ({
        ...prev,
        translatedText: null,
        error: null,
      }))
    } else {
      handlePostTranslate()
    }
  }, [translation.translatedText, handlePostTranslate])

  // Reply handler
  const handleReplyClick = useCallback(() => {
    router.push(`/post/${post._id}`) // Changed from post.id
  }, [router, post._id]) // Changed from post.id

  // Enhanced repost handler with better error handling
  const handleRepostClick = useCallback(async () => {
    if (repostLoading || !currentUserId) return // Ensure user is logged in

    setRepostLoading(true)
    try {
      const response = await fetch(`/api/posts/${post._id}/repost`, {
        // Changed from post.id
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to toggle repost")
      }
      const result = await response.json()
      onRepost(post._id, result.reposted) // Pass the actual reposted status from API
    } catch (error) {
      console.error("Error reposting:", error)
      // You might want to show a toast notification here
    } finally {
      setRepostLoading(false)
    }
  }, [repostLoading, post._id, currentUserId, onRepost]) // Changed from post.id

  // Enhanced pin handler
  const handlePinPost = useCallback(async () => {
    if (!currentUserId) return // Ensure user is logged in

    try {
      const response = await fetch(`/api/posts/${post._id}/pin`, {
        // Changed from post.id
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to toggle pin status")
      }
      const result = await response.json()
      // Assuming onReply triggers a refresh or updates the post state
      onReply?.()
    } catch (error) {
      console.error("Error pinning post:", error)
    }
  }, [post._id, currentUserId, onReply]) // Changed from post.id

  // Enhanced media rendering with loading states
  const renderMedia = useCallback((mediaUrls: string[] | null, mediaType: string | null) => {
    if (!mediaUrls || mediaUrls.length === 0) return null

    const handleMediaClick = (url: string, e: React.MouseEvent) => {
      e.stopPropagation()
      window.open(url, "_blank", "noopener,noreferrer")
    }

    if (mediaType === "video") {
      return (
        <div className="mt-3 rounded-lg overflow-hidden border">
          <video
            src={mediaUrls[0]}
            className="w-full max-h-96 object-cover"
            controls
            preload="metadata"
            onError={(e) => {
              console.error("Video load error:", e)
              // You might want to show a fallback image here
            }}
          />
        </div>
      )
    }

    if (mediaType === "gif") {
      return (
        <div className={`mt-3 grid gap-2 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {mediaUrls.slice(0, 4).map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url || "/placeholder.svg"}
                alt={`GIF media ${index + 1}`}
                className="w-full h-32 lg:h-48 object-cover cursor-pointer hover:opacity-90 rounded transition-opacity"
                onClick={(e) => handleMediaClick(url, e)}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
              {url.includes("giphy.com") && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">GIF</div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded" />
            </div>
          ))}
        </div>
      )
    }

    // Default: images
    return (
      <div className={`mt-3 grid gap-2 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {mediaUrls.slice(0, 4).map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url || "/placeholder.svg"}
              alt={`Post media ${index + 1}`}
              className="w-full h-32 lg:h-48 object-cover cursor-pointer hover:opacity-90 rounded transition-opacity"
              onClick={(e) => handleMediaClick(url, e)}
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg"
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded" />
            {mediaUrls.length > 4 && index === 3 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                <span className="text-white text-lg font-semibold">+{mediaUrls.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }, [])

  // Enhanced post click handler
  const handlePostClick = useCallback(() => {
    const pathParts = pathname.split("/")
    const currentPostId = pathParts[1] === "post" && pathParts[2] ? pathParts[2] : null
    if (currentPostId !== post._id) {
      // Changed from post.id
      router.push(`/post/${post._id}`) // Changed from post.id
    }
  }, [pathname, post._id, router]) // Changed from post.id

  // Determine what content to display
  const contentToDisplay = translation.translatedText || displayContent

  return (
    <article 
      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={handlePostClick}
      aria-label={`Post by ${post.author.displayName}`} // Changed from display_name
    >
      <div className="p-4">
        {/* Repost header */}
        {post.isRepost && ( // Changed from is_repost
          <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm">
            <Repeat2 className="h-4 w-4" />
            <span>
              Reposted by{" "}
              <Link 
                href={`/profile/${post.repostedBy}`} // Changed from reposted_by
                className="text-blue-600 hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                @{post.repostedBy}
              </Link>
            </span>
          </div>
        )}

        {/* Pin indicator */}
        {post.isPinned && ( // Changed from is_pinned
          <div className="flex items-center gap-2 mb-3 text-blue-600 text-sm">
            <Pin className="h-4 w-4" />
            <span>Pinned Post</span>
          </div>
        )}

        <div className="flex gap-3">
          <Link 
            href={`/profile/${post.author.username}`} // Changed from post.username
            className="flex-shrink-0" 
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="cursor-pointer h-10 w-10 lg:h-12 lg:w-12 ring-2 ring-transparent hover:ring-blue-200 transition-all">
              <AvatarImage src={post.author.avatarUrl || undefined} alt={`${post.author.displayName}'s avatar`} /> {/* Changed from avatar_url, display_name */}
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {post.author.displayName?.charAt(0)?.toUpperCase() || "U"} {/* Changed from display_name */}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col items-left gap-1">
              <Link
                href={`/profile/${post.author.username}`} // Changed from post.username
                className="hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="font-semibold flex items-center gap-1">
                  {post.author.displayName} {/* Changed from display_name */}
                  {post.author.isVerified && <VerificationBadge className="h-4 w-4" size={15} />} {/* Changed from is_verified */}
                </span>
              </Link>
              <div className="flex flex-row items-center gap-1 -mt-2">
                <span className="text-gray-500 text-[10px]">@{post.author.username}</span> {/* Changed from post.username */}
                <span className="text-gray-500 text-[10px]">·</span>
                <time className="text-gray-500 text-[10px]" dateTime={post.createdAt}> {/* Changed from created_at */}
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} {/* Changed from created_at */}
                </time>
              </div>
            </div>

            {/* Post content */}
            {post.content && (
              <div className="mt-2 mb-3">
                <div
                  className="text-gray-900 whitespace-pre-wrap text-sm lg:text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatContent(contentToDisplay) }}
                />
                
                {/* Show more button */}
                {shouldTrim && !isPostPage && (
                  <button
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm mt-2 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/post/${post._id}`) // Changed from post.id
                    }}
                  >
                    Show More
                  </button>
                )}
              </div>
            )}

            {/* Translation controls */}
            {isPostPage && (
              <div className="mb-3">
                <button
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleTranslation()
                  }}
                  disabled={translation.isTranslating}
                >
                  {translation.isTranslating ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Translating...</span>
                    </>
                  ) : (
                    <>
                      <Languages className="h-3 w-3" />
                      <span>{translation.translatedText ? "Show Original" : "Translate"}</span>
                    </>
                  )}
                </button>
                
                {/* Translation error */}
                {translation.error && (
                  <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{translation.error}</span>
                  </div>
                )}
              </div>
            )}

            {/* Link preview */}
            {!hasMedia && postUrl && (
              <div className="mb-3">
                <LinkPreview url={postUrl} variant="compact" />
              </div>
            )}

            {/* Media */}
            {renderMedia(post.mediaUrls, post.mediaType)} {/* Changed from media_urls, media_type */}

            {/* Action buttons */}
            <div className="flex items-center justify-between max-w-sm lg:max-w-md mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReplyClick()
                }}
                aria-label={`Reply to post. ${post.repliesCount || 0} replies\`} {/* Changed from replies_count */}
              >
                <MessageCircle className="h-4 w-4 mr-1"/>
                <span className="text-xs lg:text-sm">{post.repliesCount || 0}</span> {/* Changed from replies_count */}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={\`${
                  post.isReposted
                    ? "text-green-600 bg-green-50"
                    : "text-gray-500 hover:text-green-600 hover:bg-green-50"
                } p-2 rounded-full transition-colors`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleRepostClick()
                }}
                disabled={repostLoading}
                aria-label={`${post.isReposted ? "Unrepost" : "Repost"}. ${post.repostsCount || 0} reposts`} 
              >
                {repostLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Repeat2 className={`h-4 w-4 mr-1 ${post.isReposted ? "fill-current" : ""}`} />
                )}
                <span className="text-xs lg:text-sm">{post.repostsCount || 0}</span> {/* Changed from reposts_count */}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`${
                  post.isLiked // Changed from is_liked
                    ? "text-red-600 bg-red-50" 
                    : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                } p-2 rounded-full transition-colors`}
                onClick={(e) => {
                  e.stopPropagation()
                  onLike(post._id, post.isLiked) // Changed from post.id, is_liked
                }}
                aria-label={`${post.isLiked ? "Unlike" : "Like"} post. ${post.likesCount} likes`}
              >
                <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} /> {/* Changed from is_liked */}
                <span className="text-xs lg:text-sm">{post.likesCount}</span> {/* Changed from likes_count */}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                onClick={(e) => e.stopPropagation()}
                aria-label="Share post"
              >
                <Share className="h-4 w-4 mr-1" />
                <span className="text-xs lg:text-sm">Share</span>
              </Button>

              <PostActionsMenu
                post={post}
                currentUserId={currentUserId || ""} // Pass currentUserId
                onPostUpdated={onReply}
                onPostDeleted={onReply}
                onPinPost={handlePinPost}
              />
            </div>
          </div>
        </div>
  </div>
    </article>
  )
}
