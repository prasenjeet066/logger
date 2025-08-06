"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { PostCard } from "./post-card"
import { useMobile } from "@/hooks/use-mobile"
import { Spinner } from "@/components/loader/spinner"

// Get user's personalized timeline
/*
const timeline = await getPersonalizedTimeline(
  userId,
  'algorithmic', // or 'chronological'
  50, // limit
  0,  // skip
  { engagementWeight: 0.4 } // optional config override
)

// Get trending posts
const trending = await getTrendingPosts(20, 24) // 20 posts from last 24 hours

// Custom sorting
const sortedPosts = await sortPostsAlgorithmically(
  posts,
  'algorithmic',
  userId
)*/
interface Post {
  _id: string
  content: string
  authorId: string
  createdAt: string
  likesCount: number
  repliesCount: number
  repostsCount: number
  viewsCount: number
  mediaUrls ? : string[]
  mediaType ? : "image" | "video" | "gif"
  isRepost: boolean
  originalPostId ? : string
  parentPostId ? : string
  hashtags: string[]
  mentions: string[]
  isPinned: boolean
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl ? : string
    isVerified: boolean
  }
  isLiked: boolean
  isReposted: boolean
  repostedBy ? : string
}

export function Timeline(userId: string, typesOfAlg: string) {
  const [posts, setPosts] = useState < Post[] > ([])
  const [loading, setLoading] = useState(true)
  const [loadingPost, setLoadingPost] = useState(true)
  const [error, setError] = useState < string | null > (null)
  
  const [currentAlg, setCurrentAlg] = useState('algorithmic');
  const isMobile = useMobile()
  useEffect(() => {
    ['chronological', 'algorithmic', 'trending'].map((al) => {
      if (al === typesOfAlg) {
        setCurrentAlg(al)
      }
    })
    fetchPosts()
  }, [currentAlg, typesOfAlg])
  
  const fetchPosts = async () => {
    try {
      setLoadingPost(true)
      
      const timeline = await fetch(`/api/alg?algorithm=${currentAlg}`)
      if (timeline.ok) {
        
        const timelinePost = await timeline.json()
        setPosts(timelinePost.posts)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
      setLoadingPost(false)
    }
  }
  
  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to toggle like")
      }
      const result = await response.json()
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, isLiked: result.liked, likesCount: post.likesCount + (result.liked ? 1 : -1) } :
          post,
        ),
      )
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }
  const algorithmLevels = [
  {
    name: 'For You',
    alg: 'algorithmic',
  },
  {
    name: 'Trending',
    alg: 'trending'
    
  },
  {
    name: 'Most Recently',
    alg: 'chronological'
  }]
  const handleRepost = async (postId: string, isReposted: boolean) => {
    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to toggle repost")
      }
      const result = await response.json()
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, isReposted: result.reposted, repostsCount: post.repostsCount + (result.reposted ? 1 : -1) } :
          post,
        ),
      )
    } catch (error) {
      console.error("Error toggling repost:", error)
    }
  }
  
  // No longer need handlePostUpdate or handleNewPost here as PostCard handles its own state updates
  // and Timeline fetches all posts.
  
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
    <div className={`space-y-0 ${!isMobile && 'flex flex-col gap-2'}`}>
      <div className={`flex flex-row  gap-4 items-center   w-full my-4 ${isMobile ? "justify-between px-4":"justify-start"}`}>
        {algorithmLevels.map((lavel) => (
  <Button
    key={lavel.alg}
    className={currentAlg === lavel.alg ? 'bg-indigo-600 text-white max-h-8 rounded-full px-4 text-xs' : 'border text-gray-800 rounded-full max-h-8 text-xs'}
    onClick={() => {
      if (currentAlg !== lavel.alg) {
        setCurrentAlg(lavel.alg)
      }
    }}
  >
    {lavel.name}
  </Button>
))}
        
      </div>
      {loadingPost === true ? (
        <>
          <div className="flex justify-center items-center py-8">
        <Spinner />
      </div>
        </>
      ) : (
      <>
    
      <div>

      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onLike={handleLike}
          onRepost={handleRepost}
          // onReply is not directly handled by Timeline, but by PostCard itself
        />
      ))}
      </div>
      </>
    )}
    </div>
  )
}