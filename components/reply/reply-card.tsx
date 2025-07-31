"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, Loader2, MessageCircle, Repeat2, Share } from "lucide-react"
import Link from "next/link"
import { VerificationBadge } from "@/components/badge/verification-badge"
import LinkPreview from "@/components/link-preview"
import DOMPurify from "dompurify"
import { useRouter, usePathname } from "next/navigation"
import type { Post } from "@/types/post"
import { useSession } from "next-auth/react"

interface PostCardProps {
  post: Post
  onLike: (postId: string, isLiked: boolean) => void
  onRepost: (postId: string, isReposted: boolean) => void
  onReply ? : () => void
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

// Reply Preview Component
interface ReplyPreviewProps {
  reply: Post
  index: number
  total: number
}

const ReplyPreview = ({ reply, index, total }: ReplyPreviewProps) => {
  return (
    <div className="rounded-lg p-3 mb-2 last:mb-0">
      <div className="flex gap-3">
        <Link href={`/profile/${reply.author.username}`} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-8 w-8 border-2 border-white">
            <AvatarImage src={reply.author.avatarUrl || undefined} alt={`${reply.author.displayName}'s avatar`} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
              {reply.author.displayName?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{reply.author.displayName}</span>
            <span className="text-gray-500 text-xs">·</span>
            <time className="text-gray-500 text-xs" dateTime={reply.createdAt}>
              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: false })}
            </time>
          </div>
          <p className="text-sm text-gray-700 mt-1 line-clamp-2">{reply.content}</p>
        </div>
      </div>
    </div>
  )
}

export function ReplyCard({ post, onLike, onRepost }: PostCardProps) {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [replies, setReplies] = useState < Post[] > ([])
  const [showAllReplies, setShowAllReplies] = useState(false)
  const [repostLoading, setRepostLoading] = useState(false)
  const [translation, setTranslation] = useState < TranslationState > ({
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
  const hasMedia = useMemo(() => post.mediaUrls && post.mediaUrls.length > 0, [post.mediaUrls])
  const isPostPage = useMemo(() => pathname.startsWith("/post"), [pathname])
  
  const fetchReplies = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}/replies`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch replies")
      }
      const data = await response.json()
      setReplies(data || [])
    } catch (error) {
      console.error("Error fetching replies:", error)
    }
  }
  
  useEffect(() => {
    fetchReplies()
  }, [post._id])
  
  const MAX_LENGTH = 100
  const shouldTrim = !isPostPage && post.content.length > MAX_LENGTH
  const displayContent = shouldTrim ? smartTruncate(post.content, MAX_LENGTH) : post.content
  
  // Translation function
  const translateText = useCallback(async (text: string, targetLang = "bn"): Promise < string > => {
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
        /@([a-zA-Z0-9_]+)/g,
        '<span class="text-blue-600 hover:underline cursor-pointer font-medium transition-colors">@$1</span>',
      )
  }, [])
  
  // Media rendering
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
            }}
          />
        </div>
      )
    }
    
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
  
  const contentToDisplay = translation.translatedText || displayContent
  const previewReplies = replies.slice(0, 1)
  const hasMoreReplies = replies.length > 1
  
  return (
    <main>
      <div className={"flex p-4 flex-col" + replies.length ? " " + "pb-1" : " "}>
        <div className ='flex flex-row items-center gap-2'>
           <Link
            href={`/profile/${post.author.username}`}
            className="flex-shrink-0 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="cursor-pointer h-9 w-9">
              <AvatarImage src={post.author.avatarUrl || undefined} alt={`${post.author.displayName}'s avatar`} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {post.author.displayName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex flex-col items-left gap-1">
              <Link
                href={`/profile/${post.author.username}`}
                className="hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="font-semibold flex items-center gap-1 text-sm">
                  {post.author.displayName}
                  {post.author.isVerified && <VerificationBadge className="h-4 w-4" size={15} />}
                </span>
              </Link>
              <div className="flex flex-row items-center gap-1 -mt-1">
                <span className="text-gray-500 text-xs">@{post.author.username}</span>
                <span className="text-gray-500 text-xs">·</span>
                <time className="text-gray-500 text-xs" dateTime={post.createdAt}>
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </time>
              </div>
            </div>
        </div>
        </div>
        <div className={'flex relative h-full flex-row p-4 gap-2 pt-1'}>
          {replies.length ? (
          <div className='h-auto w-2 border-l border-b border-b  border-l  rounded-bl-md'>
            
          </div>):<></>}
          <div className='flex flex-col w-full'>
            <div>
          
            {post.content && (
              <div className="mt-2 mb-1">
                <div
                  className="text-gray-900 whitespace-pre-wrap text-xs lg:text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatContent(contentToDisplay) }}
                />

                {shouldTrim && (
                  <button
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm mt-2 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/post/${post._id}`)
                    }}
                  >
                    Show More
                  </button>
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
            </div>
            
               {/* Action buttons */}
            <div className="flex items-center justify-between w-full mt-1 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push("/post/" + post._id)
                }}
                aria-label={`Reply to post. ${replies.length || 0} replies`}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-xs lg:text-sm">{replies.length || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onRepost?.(post._id, post.isReposted)
                }}
                disabled={repostLoading}
                aria-label={`Repost. ${post.repostsCount || 0} reposts`}
              >
                {repostLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Repeat2 className="h-4 w-4 mr-1" />
                )}
                <span className="text-xs lg:text-sm">{post.repostsCount || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`rounded-full transition-colors ${
                  post.isLiked
                    ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                    : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onLike?.(post._id, post.isLiked)
                }}
                aria-label={`Like post. ${post.likesCount || 0} likes`}
              >
                <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                <span className="text-xs lg:text-sm">{post.likesCount || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  // Share functionality
                }}
                aria-label="Share post"
              >
                <Share className="h-4 w-4" />
              </Button>
            </div>
            {replies.length ?(
            <small className = 'text-xs -mb-2'>{"See more " + replies.length + " replies…"}</small>):<></>}
          </div>
        </div>
      </div>
    </main>
  )
}