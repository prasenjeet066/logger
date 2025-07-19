import type { IPost } from "@/lib/mongodb/models/Post"
import type { IUser } from "@/lib/mongodb/models/User"
import type { ILike } from "@/lib/mongodb/models/Like"
import type { IFollow } from "@/lib/mongodb/models/Follow"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"
import { Like } from "@/lib/mongodb/models/Like"
import { Follow } from "@/lib/mongodb/models/Follow"
import { connectDB } from "@/lib/mongodb/connection"

// Enhanced post interface with populated user data
export interface PopulatedPost extends Omit<IPost, 'authorId'> {
  author: IUser
  isLiked?: boolean
  isReposted?: boolean
  originalPost?: PopulatedPost
  parentPost?: PopulatedPost
}

interface UserInteraction {
  userId: string
  targetUserId: string
  interactionType: 'like' | 'repost' | 'reply' | 'follow' | 'view'
  weight: number
  createdAt: Date
  postId?: string
}

interface AlgorithmConfig {
  engagementWeight: number
  affinityWeight: number
  relevanceWeight: number
  viralityWeight: number
  diversityWeight: number
  followingBoost: number
  verificationBoost: number
  timeDecayHours: number
}

const DEFAULT_CONFIG: AlgorithmConfig = {
  engagementWeight: 0.3,
  affinityWeight: 0.25,
  relevanceWeight: 0.2,
  viralityWeight: 0.15,
  diversityWeight: 0.1,
  followingBoost: 10,
  verificationBoost: 1.2,
  timeDecayHours: 24
}

export class TimelineAlgorithm {
  private config: AlgorithmConfig

  constructor(config: Partial<AlgorithmConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Calculate engagement score based on likes, reposts, and replies
   */
  calculateEngagementScore(post: PopulatedPost): number {
    const now = new Date()
    const postTime = new Date(post.createdAt)
    const hoursOld = (now.getTime() - postTime.getTime()) / (1000 * 60 * 60)
    
    // Time decay factor (newer posts get higher scores)
    const timeDecayFactor = Math.exp(-hoursOld / this.config.timeDecayHours)
    
    // Engagement metrics with different weights
    const likesScore = post.likesCount * 1
    const repostsScore = post.repostsCount * 3  // Reposts are more valuable
    const repliesScore = post.repliesCount * 5  // Replies show high engagement
    
    // Base engagement score
    let engagementScore = (likesScore + repostsScore + repliesScore) * timeDecayFactor
    
    // Boost for verified users
    if (post.author.isVerified) {
      engagementScore *= this.config.verificationBoost
    }
    
    // Boost for posts with media
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      engagementScore *= 1.1
    }
    
    return engagementScore
  }

  /**
   * Calculate user affinity score based on follows and interactions
   */
  calculateUserAffinityScore(
    post: PopulatedPost, 
    userInteractions: UserInteraction[], 
    followingUsers: string[]
  ): number {
    let affinityScore = 0
    
    // Following bonus - posts from followed users get priority
    if (followingUsers.includes(post.author._id)) {
      affinityScore += this.config.followingBoost
    }
    
    // Interaction history with this user
    const userInteractionHistory = userInteractions.filter(
      interaction => interaction.targetUserId === post.author._id
    )
    
    const interactionWeights = {
      like: 1,
      repost: 2,
      reply: 3,
      follow: 5,
      view: 0.1
    }
    
    // Recent interactions are more valuable
    userInteractionHistory.forEach(interaction => {
      const daysSinceInteraction = (Date.now() - interaction.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      const decayFactor = Math.exp(-daysSinceInteraction / 30) // Decay over 30 days
      const weight = interactionWeights[interaction.interactionType] || 0
      affinityScore += weight * decayFactor
    })
    
    return affinityScore
  }

  /**
   * Calculate content relevance based on user's interaction patterns
   */
  calculateContentRelevanceScore(
    post: PopulatedPost, 
    userInteractions: UserInteraction[]
  ): number {
    let relevanceScore = 0
    
    // Check if user frequently interacts with this author
    const authorInteractions = userInteractions.filter(
      i => i.targetUserId === post.author._id && 
      ['like', 'repost', 'reply'].includes(i.interactionType)
    )
    
    if (authorInteractions.length > 5) {
      relevanceScore += 5
    }
    
    // Media content typically gets more engagement
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      relevanceScore += 3
      
      // Different media types
      switch (post.mediaType) {
        case 'video':
          relevanceScore += 2 // Videos are engaging
          break
        case 'image':
          relevanceScore += 1
          break
        case 'gif':
          relevanceScore += 1.5
          break
      }
    }
    
    // Longer content might be more thoughtful
    if (post.content && post.content.length > 100) {
      relevanceScore += 2
    }
    
    // Hashtags indicate topic relevance
    if (post.hashtags && post.hashtags.length > 0) {
      relevanceScore += post.hashtags.length * 0.5
    }
    
    // Mentions might be more targeted content
    if (post.mentions && post.mentions.length > 0) {
      relevanceScore += post.mentions.length * 0.3
    }
    
    return relevanceScore
  }

  /**
   * Calculate virality score based on engagement velocity
   */
  calculateViralityScore(post: PopulatedPost): number {
    const now = new Date()
    const postTime = new Date(post.createdAt)
    const hoursOld = Math.max((now.getTime() - postTime.getTime()) / (1000 * 60 * 60), 1)
    
    // Engagement velocity (engagements per hour)
    const totalEngagements = post.likesCount + post.repostsCount + post.repliesCount
    const engagementVelocity = totalEngagements / hoursOld
    
    // Viral threshold - posts gaining engagement quickly get boosted
    let viralityMultiplier = 1
    if (engagementVelocity > 10) viralityMultiplier = 3
    else if (engagementVelocity > 5) viralityMultiplier = 2
    else if (engagementVelocity > 2) viralityMultiplier = 1.5
    
    return engagementVelocity * viralityMultiplier
  }

  /**
   * Calculate diversity score to prevent timeline monotony
   */
  calculateDiversityScore(post: PopulatedPost, index: number, posts: PopulatedPost[]): number {
    // Promote diversity by reducing score for consecutive posts from same user
    const recentPosts = posts.slice(Math.max(0, index - 5), index)
    const sameUserPosts = recentPosts.filter(p => p.author._id === post.author._id).length
    const sameMediaTypePosts = recentPosts.filter(p => p.mediaType === post.mediaType).length
    
    // Penalize same user appearing multiple times recently
    const userDiversityPenalty = sameUserPosts * 0.2
    
    // Light penalty for same media type
    const mediaDiversityPenalty = sameMediaTypePosts * 0.1
    
    return Math.max(0, 1 - userDiversityPenalty - mediaDiversityPenalty)
  }

  /**
   * Calculate overall algorithmic score
   */
  calculateAlgorithmicScore(
    post: PopulatedPost,
    index: number,
    posts: PopulatedPost[],
    userInteractions: UserInteraction[],
    followingUsers: string[]
  ): number {
    const engagementScore = this.calculateEngagementScore(post)
    const affinityScore = this.calculateUserAffinityScore(post, userInteractions, followingUsers)
    const relevanceScore = this.calculateContentRelevanceScore(post, userInteractions)
    const viralityScore = this.calculateViralityScore(post)
    const diversityScore = this.calculateDiversityScore(post, index, posts)
    
    // Weighted combination of all factors
    const totalScore = (
      engagementScore * this.config.engagementWeight +
      affinityScore * this.config.affinityWeight +
      relevanceScore * this.config.relevanceWeight +
      viralityScore * this.config.viralityWeight +
      diversityScore * this.config.diversityWeight
    )
    
    return Math.max(0, totalScore) // Ensure non-negative scores
  }
}

/**
 * Fetch user interactions from database
 */
export async function fetchUserInteractions(userId: string, limit = 1000): Promise<UserInteraction[]> {
  await connectDB()
  
  const interactions: UserInteraction[] = []
  
  try {
    // Fetch likes
    const likes = await Like.find({ userId })
      .populate('postId')
      .sort({ createdAt: -1 })
      .limit(limit / 4)
      .lean()
    
    for (const like of likes) {
      if (like.postId && typeof like.postId === 'object' && 'authorId' in like.postId) {
        interactions.push({
          userId,
          targetUserId: (like.postId as any).authorId,
          interactionType: 'like',
          weight: 1,
          createdAt: like.createdAt,
          postId: like.postId._id
        })
      }
    }
    
    // Fetch follows
    const follows = await Follow.find({ followerId: userId })
      .sort({ createdAt: -1 })
      .limit(limit / 4)
      .lean()
    
    for (const follow of follows) {
      interactions.push({
        userId,
        targetUserId: follow.followingId,
        interactionType: 'follow',
        weight: 5,
        createdAt: follow.createdAt
      })
    }
    
    // Fetch replies (posts with parentPostId)
    const replies = await Post.find({ 
      authorId: userId, 
      parentPostId: { $exists: true, $ne: null } 
    })
    .populate('parentPostId')
    .sort({ createdAt: -1 })
    .limit(limit / 4)
    .lean()
    
    for (const reply of replies) {
      if (reply.parentPostId && typeof reply.parentPostId === 'object' && 'authorId' in reply.parentPostId) {
        interactions.push({
          userId,
          targetUserId: (reply.parentPostId as any).authorId,
          interactionType: 'reply',
          weight: 3,
          createdAt: reply.createdAt,
          postId: reply.parentPostId._id
        })
      }
    }
    
    // Fetch reposts
    const reposts = await Post.find({ 
      authorId: userId, 
      isRepost: true,
      originalPostId: { $exists: true, $ne: null }
    })
    .populate('originalPostId')
    .sort({ createdAt: -1 })
    .limit(limit / 4)
    .lean()
    
    for (const repost of reposts) {
      if (repost.originalPostId && typeof repost.originalPostId === 'object' && 'authorId' in repost.originalPostId) {
        interactions.push({
          userId,
          targetUserId: (repost.originalPostId as any).authorId,
          interactionType: 'repost',
          weight: 2,
          createdAt: repost.createdAt,
          postId: repost.originalPostId._id
        })
      }
    }
    
  } catch (error) {
    console.error('Error fetching user interactions:', error)
  }
  
  return interactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Fetch users that the current user is following
 */
export async function fetchFollowingUsers(userId: string): Promise<string[]> {
  await connectDB()
  
  try {
    const follows = await Follow.find({ followerId: userId }).lean()
    return follows.map(follow => follow.followingId)
  } catch (error) {
    console.error('Error fetching following users:', error)
    return []
  }
}

/**
 * Fetch and populate posts with author information
 */
export async function fetchTimelinePosts(
  userId: string,
  limit = 50,
  skip = 0
): Promise<PopulatedPost[]> {
  await connectDB()
  
  try {
    // Get users that the current user follows
    const followingUsers = await fetchFollowingUsers(userId)
    
    // Create query - include followed users and the user themselves
    const userIds = [...followingUsers, userId]
    
    const posts = await Post.find({
      $or: [
        { authorId: { $in: userIds } }, // Posts from followed users and self
        { 
          // Include viral posts (high engagement) even from non-followed users
          $and: [
            { authorId: { $nin: userIds } },
            { 
              $expr: { 
                $gt: [
                  { $add: ['$likesCount', '$repostsCount', '$repliesCount'] },
                  20 // Minimum engagement threshold for non-followed users
                ]
              }
            }
          ]
        }
      ]
    })
    .populate('authorId')
    .populate('originalPostId')
    .populate('parentPostId')
    .sort({ createdAt: -1 })
    .limit(limit * 2) // Fetch more than needed for filtering
    .skip(skip)
    .lean()
    
    // Transform to PopulatedPost format
    const populatedPosts: PopulatedPost[] = posts
      .filter(post => post.authorId && typeof post.authorId === 'object')
      .map(post => ({
        ...post,
        author: post.authorId as IUser,
        originalPost: post.originalPostId && typeof post.originalPostId === 'object' 
          ? { ...post.originalPostId, author: (post.originalPostId as any).authorId } as PopulatedPost
          : undefined,
        parentPost: post.parentPostId && typeof post.parentPostId === 'object'
          ? { ...post.parentPostId, author: (post.parentPostId as any).authorId } as PopulatedPost
          : undefined
      }))
    
    // Check if user has liked each post
    const postIds = populatedPosts.map(p => p._id)
    const userLikes = await Like.find({ 
      userId, 
      postId: { $in: postIds } 
    }).lean()
    
    const likedPostIds = new Set(userLikes.map(like => like.postId))
    
    return populatedPosts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post._id)
    })).slice(0, limit) // Return only requested amount
    
  } catch (error) {
    console.error('Error fetching timeline posts:', error)
    return []
  }
}

/**
 * Main function to sort posts algorithmically
 */
export async function sortPostsAlgorithmically(
  posts: PopulatedPost[],
  algorithmMode: 'chronological' | 'algorithmic',
  userId: string,
  config?: Partial<AlgorithmConfig>
): Promise<PopulatedPost[]> {
  
  if (algorithmMode === 'chronological') {
    return posts.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      return timeB - timeA
    })
  }
  
  // For algorithmic sorting
  const algorithm = new TimelineAlgorithm(config)
  const [userInteractions, followingUsers] = await Promise.all([
    fetchUserInteractions(userId),
    fetchFollowingUsers(userId)
  ])
  
  const scoredPosts = posts.map((post, index) => ({
    ...post,
    algorithmicScore: algorithm.calculateAlgorithmicScore(
      post,
      index,
      posts,
      userInteractions,
      followingUsers
    )
  }))
  
  return scoredPosts.sort((a, b) => (b.algorithmicScore || 0) - (a.algorithmicScore || 0))
}

/**
 * Get personalized timeline for a user
 */
export async function getPersonalizedTimeline(
  userId: string,
  algorithmMode: 'chronological' | 'algorithmic' = 'algorithmic',
  limit = 50,
  skip = 0,
  config?: Partial<AlgorithmConfig>
): Promise<PopulatedPost[]> {
  
  // Fetch posts
  const posts = await fetchTimelinePosts(userId, limit, skip)
  
  // Sort according to algorithm
  return await sortPostsAlgorithmically(posts, algorithmMode, userId, config)
}

/**
 * Get trending posts across the platform
 */
export async function getTrendingPosts(
  limit = 20,
  hoursBack = 24
): Promise<PopulatedPost[]> {
  await connectDB()
  
  try {
    const cutoffTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000))
    
    const posts = await Post.find({
      createdAt: { $gte: cutoffTime },
      $expr: {
        $gt: [
          { $add: ['$likesCount', '$repostsCount', '$repliesCount'] },
          5 // Minimum engagement for trending
        ]
      }
    })
    .populate('authorId')
    .sort({ 
      // Sort by engagement score
      $expr: {
        $divide: [
          { $add: ['$likesCount', { $multiply: ['$repostsCount', 3] }, { $multiply: ['$repliesCount', 5] }] },
          { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 3600000] } // Hours since post
        ]
      }
    })
    .limit(limit)
    .lean()
    
    return posts
      .filter(post => post.authorId && typeof post.authorId === 'object')
      .map(post => ({
        ...post,
        author: post.authorId as IUser
      }))
    
  } catch (error) {
    console.error('Error fetching trending posts:', error)
    return []
  }
}