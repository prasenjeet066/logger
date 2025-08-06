"use client"

import type React from "react"
import { useAppDispatch, useAppSelector } from "@/store/main"
import {
  nsfwMedia
} from "@/store/slices/postsSlice"
import { useState, useCallback, useMemo,useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMobile } from "@/hooks/use-mobile"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { Loader2, Languages, Repeat2, Share, Pin, AlertCircle, Heart, MessageCircle } from "lucide-react"
import Link from "next/link"
import { PostActionsMenu } from "./post-actions-menu"
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
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const dispatch = useAppDispatch()
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [repostLoading, setRepostLoading] = useState(false)
  const [translation, setTranslation] = useState < TranslationState > ({
    isTranslating: false,
    translatedText: null,
    originalText: post.content,
    targetLang: "bn",
    error: null,
  })
  const isMobile = useMobile()
  const router = useRouter()
  const pathname = usePathname()
  const [mentionsPeoples, setMentions] = useState < string[] | null > (null);
const isReplise = post.originalPostId!==null ? true : false
const addUniqueMention = (newMention: string) =>
  setMentions(prev =>
    prev?.includes(newMention) ?
    prev :
    [...(prev ?? []), newMention]
  );
  
  
  

  
  
  // Memoized values
  const postUrl = useMemo(() => extractFirstUrl(post.content), [post.content])
  const hasMedia = useMemo(() => post.mediaUrls && post.mediaUrls.length > 0, [post.mediaUrls])
  const isPostPage = useMemo(() => pathname.startsWith("/post"), [pathname])
  const [repliesTo , setRepliesTo ]=  useState(null)
  const MAX_LENGTH = 100
  const shouldTrim = !isPostPage && post.content.length > MAX_LENGTH
  const displayContent = shouldTrim ? smartTruncate(post.content, MAX_LENGTH) : post.content
  const repliesOf = async function(){
    try {
      const __user = await fetch('/api/posts/'+ post.originalPostId);
      const __data = await __user.json()
      setRepliesTo(__data.author.username)
    } catch (e) {
      setRepliesTo(null)
    }
  }
  const nsfwResult = useAppSelector((state)=>state.posts.nsfwResults)
  useEffect(()=>{
    if (post.mediaUrls.length > 1 && post.mediaType==='image') {
      dispatch(nsfwMedia(post.mediaUrls))
    }
  },[post])
  // Translation function with better error handling
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

  const checkTrueMentions = async (username) => {
  try {
    const res = await fetch('/api/users/' + encodeURIComponent(username));
    if (!res.ok) return false; // return false if request failed
    const data = await res.json();
    if (data.user) {
      addUniqueMention(username);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};
 
  // Enhanced content formatting with better security
  const formatContent = useCallback((content: string) => {
    if (repliesTo!==null) {
      content = '@'+repliesTo + ' ' + content
    }
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
        (match, p1) => {
          return `<a href="/explore?q=${encodeURIComponent('#' + p1)}" class="text-blue-600 hover:underline cursor-pointer font-medium transition-colors">#${p1}</a>`;
        }
      )
      .replace(
        /@([a-zA-Z0-9_]+)/g,(match,m1) =>{
        checkTrueMentions(m1)
        return `<span class="text-blue-600 hover:underline cursor-pointer font-medium transition-colors">@${m1}</span>`;
        
        }
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
    router.push(`/post/${post._id}`)
  }, [router, post._id])
  
  // Enhanced repost handler with better error handling
  const handleRepostClick = useCallback(async () => {
    if (repostLoading || !currentUserId) return
    
    setRepostLoading(true)
    try {
      const response = await fetch(`/api/posts/${post._id}/repost`, {
        method: "POST",
      })
      
      if (!response.ok) {
        throw new Error("Failed to toggle repost")
      }
      const result = await response.json()
      onRepost(post._id, result.reposted)
    } catch (error) {
      console.error("Error reposting:", error)
    } finally {
      setRepostLoading(false)
    }
  }, [repostLoading, post._id, currentUserId, onRepost])
  
  // Enhanced pin handler
  const handlePinPost = useCallback(async () => {
    if (!currentUserId) return
    
    try {
      const response = await fetch(`/api/users/profile`, {
        method: "POST",
        body: JSON.stringify({pinnedPostId:post._id})
      })
      
      if (!response.ok) {
        throw new Error("Failed to toggle pin status")
      }
      const result = await response.json()
      onReply?.()
    } catch (error) {
      console.error("Error pinning post:", error)
    }
  }, [post._id, currentUserId, onReply])
  useEffect(()=>{
    if(isReplise){
    repliesOf()
    }
  },[isReplise])
  // Enhanced media rendering with loading states
  const renderMedia = useCallback((mediaUrls: string[] | null, mediaType: string | null ) => {
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
            className=" aspect-video object-cover "
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
    let nsfw = nsfwResult?.label && nsfwResult.label !== "normal";
    // Default: images
    return (
      <div className={`mt-3 grid gap-2 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {mediaUrls.slice(0, 4).map((url, index) => (
          <div key={index} className={"relative group" + nsfw ? " backdrop-blur-lg flex flex flex-col items-center justify-center" : ""}>
            {nsfw ? (
              <>
                <span className='font-semibold text-white text-center'>NSFW</span>
                </>
            ):<></>}
            <img
              src={url || "/placeholder.svg"}
              alt={`Post media ${index + 1}`}
              className="object-cover cursor-pointer hover:opacity-90
              aspect-3/2
              
              rounded transition-opacity"
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
  const reviewResults = post?.reviewResults?.content ?
  JSON.parse(post.reviewResults.content) :
  [];
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
      className={isMobile==true ? "border-b hover:bg-gray-50 transition-colors h-auto cursor-pointer":"space-y-2 hover:bg-gray-50 transition-colors cursor-pointer h-auto rounded-md border-2 border-gray-50 "}
      
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


        <div className="flex flex-col gap-3">
          <div className = 'flex flex gap-3'>
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
              <div className='flex flex-row items-center justify-start gap-2'>
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
              {mentionsPeoples!==null && (
                <div className='flex flex-row items-center gap-2'>
                  <small className='text-xs text-gray-500'>{"with"}</small>
                 <Link href ={"profile/"+mentionsPeoples[0]}>
                      <small>@{mentionsPeoples[0]}</small>
                      </Link>
              {mentionsPeoples.length > 1 && (<small> and more {mentionsPeoples.length - 1 }</small>
                
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
                <span className="text-gray-500 text-[10px]">·</span>
                {post.visibility ? ( <span className='text-[10px] text-gray-500 uppercase'>
                  {post.visibility}
                </span>):(<></>)}
               
              </div>
            </div>
</div>
            {/* Post content */}
           </div>
           {post.content && (
              <div className="mt-2" onClick={handlePostClick}>
                <div
                  className="text-gray-900 whitespace-pre-wrap text-sm lg:text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatContent(contentToDisplay) }}
                />

                {/* Show more button */}
                {shouldTrim && !isPostPage && (
                  <button
                    className="text-blue-600 rounded-full w-full py-2 text-center border text-sm mt-2 transition-colors"
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

            {/* Translation controls */}
            

            {/* Link preview */}
            {!hasMedia && postUrl && (
              <div className="mb-3">
                <LinkPreview url={postUrl} variant="compact" />
              </div>
            )}

            {/* Media */}
          
            {renderMedia(post.mediaUrls, post.mediaType)}
           

           
            {reviewResults && reviewResults.isTrueInfo===false ? (
              <div className='bg-gary-50 rounded-md p-2 text-left flex flex-row items-center justify-between border text-xs'>
                <small className='flex-1 pr-2 text-gray-600'>{reviewResults?.oneLineAboutThisText || "This Post is not correct!"}</small>
                
                <span className='border-l pl-1 text-gray-800  underline font-semibold' onClick = {()=>{router.push('fact-check?post=' + post._id)}}>{"Fact Check"}</span>
              </div>
            ):<></>}
            
            {post.watch ?  (
              <span className='text-xs text-gray-600'>
                {post.watch} watched
              </span>
            ): <></>}
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
                aria-label={`Reply to post. ${post.repliesCount || 0} replies`}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-xs lg:text-sm">{post.repliesCount || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`${
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
                <span className="text-xs lg:text-sm">{post.repostsCount || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`${
                  post.isLiked ? "text-red-600 bg-red-50" : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                } p-2 rounded-full transition-colors`}
                onClick={(e) => {
                  e.stopPropagation()
                  onLike(post._id, post.isLiked)
                }}
                aria-label={`${post.isLiked ? "Unlike" : "Like"} post. ${post.likesCount} likes`}
              >
                <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                <span className="text-xs lg:text-sm">{post.likesCount}</span>
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