"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerificationBadge } from "@/components/badge/verification-badge"
import LinkPreview from "@/components/link-preview"
import DOMPurify from "dompurify"
import { Repeat2 } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import type { Post } from "@/types/post"

type Mention = { username: string;displayName: string }

interface PostCardReadOnlyProps {
  post: Post
}

const extractFirstUrl = (text: string): string | null => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const match = text.match(urlRegex)
  return match ? match[0] : null
}

const smartTruncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  const words = text.split(" ")
  let truncated = ""
  for (const word of words) {
    if ((truncated + word + " ").length > maxLength) break
    truncated += word + " "
  }
  return truncated.trim() + "..."
}

export function PostCardReadOnly({ post }: PostCardReadOnlyProps) {
  const isMobile = useMobile()
  const router = useRouter()
  const pathname = usePathname()
  
  const [repliesTo, setRepliesTo] = useState < string | null > (null)
  const postUrl = useMemo(() => extractFirstUrl(post.content), [post.content])
  const hasMedia = useMemo(() => post.mediaUrls && post.mediaUrls.length > 0, [post.mediaUrls])
  const isPostPage = useMemo(() => pathname.startsWith("/post"), [pathname])
  
  const MAX_LENGTH = 100
  const shouldTrim = !isPostPage && post.content.length > MAX_LENGTH
  const displayContent = shouldTrim ? smartTruncate(post.content, MAX_LENGTH) : post.content
  
  const nsfwResults = post?.imageNSFW
  
  useEffect(() => {
    if (post.originalPostId) {
      fetch(`/api/posts/${post.originalPostId}`)
        .then((res) => res.json())
        .then((data) => setRepliesTo(data.author.username))
        .catch(() => setRepliesTo(null))
    }
  }, [post.originalPostId])
  
  const formatContent = useCallback((content: string) => {
    if (repliesTo) {
      content = '@' + repliesTo + ' ' + content
    }
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    })
    return sanitizedContent.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline break-all hover:text-blue-800 transition-colors">$1</a>'
    )
  }, [repliesTo])
  
  const handlePostClick = () => {
    const pathParts = pathname.split("/")
    const currentPostId = pathParts[1] === "post" && pathParts[2] ? pathParts[2] : null
    if (currentPostId !== post._id) {
      router.push(`/post/${post._id}`)
    }
  }
  
  const renderMedia = useCallback((mediaUrls: string[] | null, mediaType: string | null) => {
    if (!mediaUrls || mediaUrls.length === 0) return null
    
    if (mediaType === "video") {
      return (
        <div className="mt-3 rounded-lg overflow-hidden border">
          <video
            src={mediaUrls[0]}
            className="aspect-video object-cover"
            controls
            preload="metadata"
          />
        </div>
      )
    }
    
    const isNsfw = nsfwResults?.label && nsfwResults.label !== "normal"
    
    return (
      <div className={`mt-3 grid gap-2 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {mediaUrls.slice(0, 4).map((url, index) => (
          <div
            key={index}
            className={`relative group ${isNsfw ? "backdrop-blur-lg flex flex-col items-center justify-center" : ""}`}
          >
            <img
              src={url || "/placeholder.svg"}
              alt={`Post media ${index + 1}`}
              className={`object-cover aspect-3/2 rounded transition-opacity ${isNsfw ? "blur-xl" : ""}`}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    )
  }, [nsfwResults])
  
  return (
    <article
      className={
        isMobile
          ? "border-b hover:bg-gray-50 transition-colors h-auto cursor-pointer"
          : "space-y-2 hover:bg-gray-50 transition-colors cursor-pointer h-auto rounded-md border-2 border-gray-50"
      }
      aria-label={`Post by ${post.author.displayName}`}
    >
      <div className="p-4">
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

        <div className="flex flex-col gap-2">
          <div className="flex flex gap-3">
            <Link
              href={`/profile/${post.author.username}`}
              className="flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar className="cursor-pointer h-10 w-10 lg:h-12 lg:w-12 ring-2 ring-transparent hover:ring-blue-200 transition-all">
                <AvatarImage src={post.author.avatarUrl || undefined} alt={`${post.author.displayName}'s avatar`} />
                <AvatarFallback>
                  {post.author.displayName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col items-left gap-1">
                <div className="flex flex-row items-center gap-2">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="hover:underline transition-colors"
                  >
                    <span className="font-semibold flex items-center gap-1">
                      {post.author.displayName}
                      {post.author.isVerified && <VerificationBadge className="h-4 w-4" />}
                    </span>
                  </Link>
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

          {post.content && (
            <div className="mt-2" onClick={handlePostClick}>
              <div
                className="text-gray-900 whitespace-pre-wrap text-sm lg:text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatContent(displayContent) }}
              />
              {shouldTrim && !isPostPage && (
                <button
                  className="text-blue-600 rounded-full w-full py-2 text-center border text-sm mt-2"
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

          {!hasMedia && postUrl && (
            <div className="mb-3">
              <LinkPreview url={postUrl} variant="compact" />
            </div>
          )}

          {renderMedia(post.mediaUrls, post.mediaType)}
        </div>
      </div>
    </article>
  )
}