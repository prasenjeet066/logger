import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"
import { Like } from "@/lib/mongodb/models/Like"
import { Follow } from "@/lib/mongodb/models/Follow"
import { unstable_cache } from 'next/cache'

export interface TimelinePost {
  _id: string
  content: string
  authorId: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
    isVerified?: boolean
  }
  mediaUrls?: string[]
  mediaType?: string
  likesCount: number
  repostsCount: number
  repliesCount: number
  isRepost?: boolean
  originalPostId?: string
  originalPost?: any
  parentPostId?: string
  hashtags?: string[]
  mentions?: string[]
  isPinned?: boolean
  createdAt: string
  updatedAt: string
  isLiked: boolean
  isReposted: boolean
  algorithmScore?: number
}

// Cache configuration
const CACHE_TAGS = {
  TIMELINE: 'timeline',
  TRENDING: 'trending',
  USER_INTERACTIONS: 'user-interactions'
}

const CACHE_DURATIONS = {
  TIMELINE: 60, // 1 minute
  TRENDING: 300, // 5 minutes
  USER_FEED: 30, // 30 seconds
  PUBLIC_TIMELINE: 120 // 2 minutes
}

/**
 * Cached timeline fetcher with ISR
 */
export const getTimelinePosts = unstable_cache(
  async (userId: string, algorithm: string = 'algorithmic', limit: number = 20) => {
    await connectDB()
    
    // Get following users
    const following = await Follow.find({ followerId: userId }).select("followingId").lean()
    const followingIds = following.map(f => f.followingId.toString())
    followingIds.push(userId)
    
    let postQuery: any
    if (algorithm === "algorithmic") {
      postQuery = {
        $or: [
          { visibility: "public" },
          { visibility: { $exists: false } }
        ],
        $or: [
          { authorId: { $in: followingIds } },
          {
            authorId: { $nin: followingIds },
            $expr: {
              $gt: [
                { $add: ["$likesCount", "$repostsCount", "$repliesCount"] },
                10
              ]
            }
          }
        ]
      }
    } else if (algorithm === "trending") {
      const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000))
      postQuery = {
        createdAt: { $gte: cutoffTime },
        $or: [
          { visibility: "public" },
          { visibility: { $exists: false } }
        ],
        $expr: {
          $gt: [
            { $add: ["$likesCount", "$repostsCount", "$repliesCount"] },
            3
          ]
        }
      }
    } else {
      // Chronological
      postQuery = {
        $or: [
          { visibility: "public" },
          { visibility: { $exists: false } }
        ],
        authorId: { $in: followingIds }
      }
    }
    
    const posts = await Post.find(postQuery)
      .sort({ createdAt: -1 })
      .limit(limit * 2) // Fetch more for algorithmic sorting
      .lean()
    
    // Get author information
    const authorIds = [...new Set(posts.map(post => post.authorId))]
    const authors = await User.find({
      _id: { $in: authorIds }
    }).select("_id username displayName avatarUrl isVerified").lean()
    
    const authorMap = new Map(authors.map(author => [author._id.toString(), author]))
    
    // Format posts without user-specific data (likes, reposts)
    const formattedPosts = posts.map(post => {
      const author = authorMap.get(post.authorId)
      
      return {
        _id: post._id.toString(),
        content: post.content,
        authorId: post.authorId,
        author: {
          id: author?._id.toString() || "",
          username: author?.username || "",
          displayName: author?.displayName || "",
          avatarUrl: author?.avatarUrl,
          isVerified: author?.isVerified || false
        },
        mediaUrls: post.mediaUrls || [],
        mediaType: post.mediaType,
        likesCount: post.likesCount || 0,
        repostsCount: post.repostsCount || 0,
        repliesCount: post.repliesCount || 0,
        isRepost: post.isRepost || false,
        originalPostId: post.originalPostId,
        parentPostId: post.parentPostId,
        hashtags: post.hashtags || [],
        mentions: post.mentions || [],
        isPinned: post.isPinned || false,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        isLiked: false, // Will be hydrated client-side
        isReposted: false // Will be hydrated client-side
      }
    }).slice(0, limit)
    
    return formattedPosts
  },
  ['timeline-posts'],
  {
    revalidate: CACHE_DURATIONS.TIMELINE,
    tags: [CACHE_TAGS.TIMELINE]
  }
)

/**
 * Get user-specific interaction data (not cached, always fresh)
 */
export const getUserInteractions = async (userId: string, postIds: string[]) => {
  await connectDB()
  
  const [likedPosts, repostedPosts] = await Promise.all([
    Like.find({
      userId: userId,
      postId: { $in: postIds }
    }).select("postId").lean(),
    
    Post.find({
      authorId: userId,
      isRepost: true,
      originalPostId: { $in: postIds }
    }).select("originalPostId").lean(),
  ])
  
  return {
    likedPostIds: new Set(likedPosts.map(like => like.postId.toString())),
    repostedOriginalPostIds: new Set(repostedPosts.map(repost => repost.originalPostId?.toString()))
  }
}