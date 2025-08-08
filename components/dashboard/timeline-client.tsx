"use client"

import { useState, useOptimistic } from "react"
import { PostCard } from "./post-card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { TimelinePost } from "@/lib/timeline/timeline-service"

interface TimelineClientProps {
  initialPosts: TimelinePost[]
  algorithm: string
  userId: string
  page: number
}

export function TimelineClient({ 
  initialPosts, 
  algorithm, 
  userId, 
  page 
}: TimelineClientProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [optimisticPosts, setOptimisticPosts] = useOptimistic(posts)
  const router = useRouter()
  
  const algorithmLevels = [
    { name: 'For You', alg: 'algorithmic' },
    { name: 'Trending', alg: 'trending' },
    { name: 'Most Recently', alg: 'chronological' }
  ]
  
  const handleAlgorithmChange = (newAlg: string) => {
    if (newAlg !== algorithm) {
      router.push(`/dashboard/timeline?algorithm=${newAlg}`)
    }
  }
  
  const handleLike = async (postId: string, isLiked: boolean) => {
    // Optimistic update
    setOptimisticPosts(prev => 
      prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              isLiked: !isLiked, 
              likesCount: post.likesCount + (isLiked ? -1 : 1) 
            }
          : post
      )
    )
    
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })
      
      if (!response.ok) throw new Error("Failed to toggle like")
      
      const result = await response.json()
      
      // Update with actual result
      setPosts(prev => 
        prev.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                isLiked: result.liked, 
                likesCount: result.likesCount 
              }
            : post
        )
      )
    } catch (error) {
      // Revert optimistic update on error
      setPosts(prev => 
        prev.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                isLiked: isLiked, 
                likesCount: post.likesCount + (isLiked ? 1 : -1) 
              }
            : post
        )
      )
      console.error("Error toggling like:", error)
    }
  }
  
  const handleRepost = async (postId: string, isReposted: boolean) => {
    // Similar optimistic update pattern for reposts
    setOptimisticPosts(prev => 
      prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              isReposted: !isReposted, 
              repostsCount: post.repostsCount + (isReposted ? -1 : 1) 
            }
          : post
      )
    )
    
    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
      })
      
      if (!response.ok) throw new Error("Failed to toggle repost")
      
      const result = await response.json()
      
      setPosts(prev => 
        prev.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                isReposted: result.reposted, 
                repostsCount: result.repostsCount 
              }
            : post
        )
      )
    } catch (error) {
      // Revert on error
      setPosts(prev => 
        prev.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                isReposted: isReposted, 
                repostsCount: post.repostsCount + (isReposted ? 1 : -1) 
              }
            : post
        )
      )
      console.error("Error toggling repost:", error)
    }
  }
  
  return (
    <div className="space-y-0">
      <div className="flex flex-row gap-4 items-center w-full my-4 justify-between px-4">
        {algorithmLevels.map((level) => (
          <Button
            key={level.alg}
            className={
              algorithm === level.alg 
                ? 'bg-indigo-600 text-white max-h-8 rounded-full px-4 text-xs' 
                : 'border text-gray-800 rounded-full bg-white text-gray-800 max-h-8 text-xs'
            }
            onClick={() => handleAlgorithmChange(level.alg)}
          >
            {level.name}
          </Button>
        ))}
      </div>
      
      <div>
        {optimisticPosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={handleLike}
            onRepost={handleRepost}
          />
        ))}
      </div>
    </div>
  )
}