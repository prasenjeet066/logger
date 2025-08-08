// Updated PostSection component with optimistic UI updates
"use client"

import type React from "react"
import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getImageRatioFromSrc, getHeightFromWidth } from "@/lib/ration-lib"
import { Button } from "@/components/ui/button"
import { Heart, Loader2, MessageCircle, Languages, Repeat2, Share, Pin, AlertCircle } from "lucide-react"
import Link from "next/link"
import { PostActionsMenu } from "@/components/dashboard/post-actions-menu"
import { VerificationBadge } from "@/components/badge/verification-badge"
import LinkPreview from "@/components/link-preview"
import DOMPurify from "dompurify"
import { useRouter, usePathname } from "next/navigation"
import type { Post } from "@/types/post"
import { useSession } from "next-auth/react"
import { loadModule } from 'cld3-asm'

interface PostCardProps {
  post: Post
  onLike: (postId: string, isLiked: boolean) => void
  onRepost: (postId: string, isReposted: boolean) => void
  onReply?: () => void
  isMobile?: boolean
}

interface TranslationState {
  isTranslating: boolean
  translatedText: string | null
  originalText: string
  targetLang: string
  error: string | null
}

// Optimistic UI state for actions
interface ActionStates {
  like: {
    isLoading: boolean
    optimisticCount: number
    optimisticLiked: boolean
  }
  repost: {
    isLoading: boolean
    optimisticCount: number
    optimisticReposted: boolean
  }
  reply: {
    isLoading: boolean
    optimisticCount: number
  }
}

// Utility functions
const extractFirstUrl = (text: string): string | null => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const match = text.match(urlRegex)
  return match ? match[0] : null
}

const smartTruncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  
  const sentences = text.match(/[^.!?]+[.!?]+/g)
  if (sentences) {
    let truncated = ""
    for (const sentence of sentences) {
      if ((truncated + sentence).length > maxLength) break
      truncated += sentence
    }
    if (truncated.length > 0) return truncated.trim() + "..."
  }
  
  const words = text.split(" ")
  let truncated = ""
  for (const word of words) {
    if ((truncated + word + " ").length > maxLength) break
    truncated += word + " "
  }
  
  return truncated.trim() + "..."
}

export function PostSection({ post, onLike, onRepost, onReply, isMobile = false }: PostCardProps) {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [showTrim, setShowTrim] = useState("trim")
  const [mentionsPeoples, setMentions] = useState<string[] | null>(null)
  const [translation, setTranslation] = useState<TranslationState>({
    isTranslating: false,
    translatedText: null,
    originalText: post.content,
    targetLang: "bn",
    error: null,
  })
  
  // Optimistic UI states
  const [actionStates, setActionStates] = useState<ActionStates>({
    like: {
      isLoading: false,
      optimisticCount: post.likesCount || 0,
      optimisticLiked: post.isLiked || false
    },
    repost: {
      isLoading: false,
      optimisticCount: post.repostsCount || 0,
      optimisticReposted: post.isReposted || false
    },
    reply: {
      isLoading: false,
      optimisticCount: post.repliesCount || 0
    }
  })
  
  const router = useRouter()
  const pathname = usePathname()
  
  // Memoized values
  const postUrl = useMemo(() => extractFirstUrl(post.content), [post.content])
  const hasMedia = useMemo(() => post.mediaUrls && post.mediaUrls.length > 0, [post.mediaUrls])
  const isPostPage = useMemo(() => pathname.startsWith("/post"), [pathname])
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageH, setH] = useState(0)
  const [postLang, setPostLang] = useState('en')
  const MAX_LENGTH = 100
  const shouldTrim = post.content.length > MAX_LENGTH
  const displayContent = shouldTrim && showTrim === "trim" ? smartTruncate(post.content, MAX_LENGTH) : post.content

  // Update action states when post prop changes
  useEffect(() => {
    setActionStates({
      like: {
        isLoading: false,
        optimisticCount: post.likesCount || 0,
        optimisticLiked: post.isLiked || false
      },
      repost: {
        isLoading: false,
        optimisticCount: post.repostsCount || 0,
        optimisticReposted: post.isReposted || false
      },
      reply: {
        isLoading: false,
        optimisticCount: post.repliesCount || 0
      }
    })
  }, [post.likesCount, post.isLiked, post.repostsCount, post.isReposted, post.repliesCount])

  async function detectLanguage(text: string) {
    try {
      const cldFactory = await loadModule()
      const cld = cldFactory.create()
      const result = cld.findLanguage(text)
      
      if (result && result.isReliable) {
        return result.language
      } else if (result) {
        return result.language
      } else {
        return null
      }
    } catch (error) {
      console.error("Error loading or using CLD3:", error)
      return null
    }
  }

  // Function to check mentions
  const checkTrueMentions = useCallback((username: string) => {
    setMentions(prev => {
      if (prev && !prev.includes(username)) {
        return [...prev, username]
      } else if (!prev) {
        return [username]
      }
      return prev
    })
  }, [])
  
  // Translation function
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
  
  // Enhanced content formatting
  const formatContent = useCallback((content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    
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
        /@([a-zA-Z0-9_]+)/g, (match, m1) => {
          checkTrueMentions(m1)
          return `<span class="text-blue-600 hover:underline cursor-pointer font-medium transition-colors">@${m1}</span>`
        }
      )
  }, [checkTrueMentions])
  
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
    router.push(`/post/${post._id}`)
  }, [router, post._id])
  
  // OPTIMISTIC LIKE HANDLER
  const handleLikeClick = useCallback(async () => {
    if (actionStates.like.isLoading || !currentUserId) return
    
    const currentLiked = actionStates.like.optimisticLiked
    const currentCount = actionStates.like.optimisticCount
    
    // Optimistic update
    setActionStates(prev => ({
      ...prev,
      like: {
        isLoading: true,
        optimisticLiked: !currentLiked,
        optimisticCount: currentLiked ? currentCount - 1 : currentCount + 1
      }
    }))
    
    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !currentLiked }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to toggle like")
      }
      
      const result = await response.json()
      
      // Update with server response
      setActionStates(prev => ({
        ...prev,
        like: {
          isLoading: false,
          optimisticLiked: result.isLiked,
          optimisticCount: result.likesCount
        }
      }))
      
      // Call parent callback for any additional updates
      onLike(post._id, result.isLiked)
      
    } catch (error) {
      console.error("Error liking post:", error)
      
      // Revert optimistic update on error
      setActionStates(prev => ({
        ...prev,
        like: {
          isLoading: false,
          optimisticLiked: currentLiked,
          optimisticCount: currentCount
        }
      }))
    }
  }, [actionStates.like, post._id, currentUserId, onLike])
  
  // OPTIMISTIC REPOST HANDLER
  const handleRepostClick = useCallback(async () => {
    if (actionStates.repost.isLoading || !currentUserId) return
    
    const currentReposted = actionStates.repost.optimisticReposted
    const currentCount = actionStates.repost.optimisticCount
    
    // Optimistic update
    setActionStates(prev => ({
      ...prev,
      repost: {
        isLoading: true,
        optimisticReposted: !currentReposted,
        optimisticCount: currentReposted ? currentCount - 1 : currentCount + 1
      }
    }))
    
    try {
      const response = await fetch(`/api/posts/${post._id}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reposted: !currentReposted }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to toggle repost")
      }
      
      const result = await response.json()
      
      // Update with server response
      setActionStates(prev => ({
        ...prev,
        repost: {
          isLoading: false,
          optimisticReposted: result.isReposted,
          optimisticCount: result.repostsCount
        }
      }))
      
      // Call parent callback
      onRepost(post._id, result.isReposted)
      
    } catch (error) {
      console.error("Error reposting:", error)
      
      // Revert optimistic update on error
      setActionStates(prev => ({
        ...prev,
        repost: {
          isLoading: false,
          optimisticReposted: currentReposted,
          optimisticCount: currentCount
        }
      }))
    }
  }, [actionStates.repost, post._id, currentUserId, onRepost])
  
  // Enhanced pin handler
  const handlePinPost = useCallback(async () => {
    if (!currentUserId) return
    
    try {
      const response = await fetch(`/api/posts/${post._id}/pin`, {
        method: "POST",
      })
      
      if (!response.ok) {
        throw new Error("Failed to toggle pin status")
      }
      
      onReply?.()
    } catch (error) {
      console.error("Error pinning post:", error)
    }
  }, [post._id, currentUserId, onReply])

  useEffect(() => {
    const detect = async () => {
      if (post.content.length) {
        const lang = await detectLanguage(post.content)
        setPostLang(lang || 'en')
      }
    }
    detect()
  }, [post])
  
  // Enhanced media rendering
  const renderMedia = useCallback(
    (mediaUrls: string[] | null, mediaType: string | null) => {
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
              className="w-full aspect-video object-cover"
              controls
              preload="metadata"
              onError={(e) => {
                console.error("Video load error:", e)
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
                  className="w-full max-h-48 aspect-3/3 object-cover cursor-pointer hover:opacity-90 rounded transition-opacity"
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
      
      if (imageRef.current && mediaUrls[0]) {
        getImageRatioFromSrc(mediaUrls[0]).then((ratio) => {
          const height = getHeightFromWidth(imageRef.current?.style.width || "100%", ratio)
          setH(height)
        })
      }
      
      // Default: images
      return (
        <div className={`mt-3 grid gap-2 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {mediaUrls.slice(0, 4).map((url, index) => (
            <div key={index} className="relative group">
              <img
                ref={imageRef}
                src={url || "/placeholder.svg"}
                alt={`Post media ${index + 1}`}
                className={`w-full ${imageH ? `h-[${imageH}px]` : "h-32 lg:h-48"} object-cover cursor-pointer hover:opacity-90 rounded transition-opacity`}
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
    },
    [imageH],
  )
  
  // Enhanced post click handler
  const handlePostClick = useCallback(() => {
    const pathParts = pathname.split("/")
    const currentPostId = pathParts[1] === "post" && pathParts[2] ? pathParts[2] : null
    if (currentPostId !== post._id) {
      router.push(`/post/${post._id}`)
    }
  }, [pathname, post._id, router])
  
  // Determine what content to display
  const contentToDisplay = translation.translatedText || displayContent
  
  return (
    <article
      className={isMobile ? "border-b hover:bg-gray-50 transition-colors h-auto cursor-pointer" : "space-y-2 hover:bg-gray-50 transition-colors cursor-pointer h-auto rounded-md border-2 border-gray-50"}
       aria-label={`Post by ${post.author.displayName}`}
    >
      <div className="p-4">
        {/* Repost header */}
        {post.isRepost && (
          <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm">
            <Repeat2 className="h-4 w-4" />
            <span>
              Reposted by{" "}
              <Link
                href={`/profile/${post.repostedBy}`}
                className="text-blue-600 hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                @{post.repostedBy}
              </Link>
            </span>
          </div>
        )}

        {/* Pin indicator */}
        {post.isPinned && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <Pin className="h-4 w-4" />
            <span>Pinned Post</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Link
              href={`/profile/${post.author.username}`}
              className="flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar className="cursor-pointer h-10 w-10 lg:h-12 lg:w-12 ring-2 ring-transparent hover:ring-blue-200 transition-all">
                <AvatarImage src={post.author.avatarUrl || undefined} alt={`${post.author.displayName}'s avatar`} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {post.author.displayName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col items-left gap-1">
                <div className="flex flex-row items-center justify-start gap-2">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="hover:underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-semibold flex items-center gap-1">
                      {post.author.displayName}
                      {post.author.isVerified && <VerificationBadge className="h-4 w-4" size={15} />}
                    </span>
                  </Link>
                  {mentionsPeoples !== null && (
                    <div className="flex flex-row items-center gap-2">
                      <small className="text-xs text-gray-500">{"with"}</small>
                      <Link href={`/profile/${mentionsPeoples[0]}`}>
                        <small>@{mentionsPeoples[0]}</small>
                      </Link>
                      {mentionsPeoples.length > 1 && (
                        <small> and {mentionsPeoples.length - 1} more</small> 
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-row items-center gap-1 -mt-2">
                  <span className="text-gray-500 text-[10px]">@{post.author.username}</span>
                  <span className="text-gray-500 text-[10px]">·</span>
                  <time className="text-gray-500 text-[10px]" dateTime={post.createdAt}>
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </time>
                </div>
              </div>
            </div>
          </div>
          
          {/* Post content */}
          {post.content && (
            <div className="mt-2">
              <div
                className={`text-gray-900 whitespace-pre-wrap text-sm lg:text-base leading-relaxed ${postLang === 'bn' ? "font-bengali" : ""}`}
                dangerouslySetInnerHTML={{ __html: formatContent(contentToDisplay) }}
              />

              {/* Show more/less button */}
              {shouldTrim && (
                <button
                  className="text-blue-600 hover:underline text-sm mt-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowTrim(showTrim === "trim" ? "full" : "trim")
                  }}
                >
                  {showTrim === "trim" ? "Show more" : "Show less"}
                </button>
              )}
            </div>
          )}

          {/* Translation controls */}
          {post.content && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleTranslation()
                }}
                disabled={translation.isTranslating}
                aria-label="Translate post"
              >
                {translation.isTranslating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Languages className="h-4 w-4" />
                )}
                <span className="text-xs ml-1">
                  {translation.translatedText ? "Show original" : "Translate"}
                </span>
              </Button>
              {translation.error && (
                <div className="flex items-center gap-1 text-red-500 text-xs">
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
          {renderMedia(post.mediaUrls, post.mediaType)}
          
          {post.watch && (
            <span className="text-xs text-gray-600">
              {post.watch} watched
            </span>
          )}
          
          {/* Action buttons with optimistic UI */}
          <div className="flex items-center justify-between max-w-sm lg:max-w-md mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                handleReplyClick()
              }}
              aria-label={`Reply to post. ${actionStates.reply.optimisticCount} replies`}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-xs lg:text-sm">{actionStates.reply.optimisticCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`${
                actionStates.repost.optimisticReposted
                  ? "text-green-600 bg-green-50"
                  : "text-gray-500 hover:text-green-600 hover:bg-green-50"
              } p-2 rounded-full transition-colors`}
              onClick={(e) => {
                e.stopPropagation()
                handleRepostClick()
              }}
              disabled={actionStates.repost.isLoading}
              aria-label={`${actionStates.repost.optimisticReposted ? "Unrepost" : "Repost"}. ${actionStates.repost.optimisticCount} reposts`}
            >
              {actionStates.repost.isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Repeat2 className={`h-4 w-4 mr-1 ${actionStates.repost.optimisticReposted ? "fill-current" : ""}`} />
              )}
              <span className="text-xs lg:text-sm">{actionStates.repost.optimisticCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`${
                actionStates.like.optimisticLiked 
                  ? "text-red-600 bg-red-50" 
                  : "text-gray-500 hover:text-red-600 hover:bg-red-50"
              } p-2 rounded-full transition-colors`}
              onClick={(e) => {
                e.stopPropagation()
                handleLikeClick()
              }}
              disabled={actionStates.like.isLoading}
              aria-label={`${actionStates.like.optimisticLiked ? "Unlike" : "Like"} post. ${actionStates.like.optimisticCount} likes`}
            >
              {actionStates.like.isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 mr-1 ${actionStates.like.optimisticLiked ? "fill-current" : ""}`} />
              )}
              <span className="text-xs lg:text-sm">{actionStates.like.optimisticCount}</span>
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
              currentUserId={currentUserId || ""}
              onPostUpdated={onReply}
              onPostDeleted={onReply}
              onPinPost={handlePinPost}
            />
          </div>
        </div>
      </div>
    </article>
  )
}