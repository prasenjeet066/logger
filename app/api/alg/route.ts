// app/api/timeline/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"
import { Like } from "@/lib/mongodb/models/Like"
import { Follow } from "@/lib/mongodb/models/Follow"

// Timeline Algorithm Configuration
interface AlgorithmConfig {
  recencyWeight: number
  engagementWeight: number
  affinityWeight: number
  viralityWeight: number
  diversityWeight: number
  timeDecayHours: number
  followingBoost: number
  verifiedBoost: number
}

const DEFAULT_CONFIG: AlgorithmConfig = {
  recencyWeight: 0.25,
  engagementWeight: 0.30,
  affinityWeight: 0.25,
  viralityWeight: 0.15,
  diversityWeight: 0.05,
  timeDecayHours: 24,
  followingBoost: 10,
  verifiedBoost: 1.2
}

interface PostWithScore {
  _id: string
  content: string
  authorId: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl ? : string
    isVerified ? : boolean
  }
  mediaUrls ? : string[]
  mediaType ? : string
  likesCount: number
  repostsCount: number
  repliesCount: number
  isRepost ? : boolean
  originalPostId ? : string
  originalPost ? : any
  parentPostId ? : string
  hashtags ? : string[]
  mentions ? : string[]
  isPinned ? : boolean
  createdAt: string
  updatedAt: string
  isLiked: boolean
  isReposted: boolean
  algorithmScore ? : number
  recencyScore ? : number
  engagementScore ? : number
  affinityScore ? : number
  viralityScore ? : number
  diversityScore ? : number
}

class TimelineAlgorithm {
  private config: AlgorithmConfig
  
  constructor(config: Partial < AlgorithmConfig > = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }
  
  /**
   * Calculate recency score with exponential decay
   */
  calculateRecencyScore(createdAt: Date): number {
    const now = Date.now()
    const postTime = createdAt.getTime()
    const hoursSincePost = (now - postTime) / (1000 * 60 * 60)
    
    // Exponential decay function
    return Math.exp(-hoursSincePost / this.config.timeDecayHours)
  }
  
  /**
   * Calculate engagement score based on interactions
   */
  calculateEngagementScore(post: PostWithScore): number {
    const likesWeight = 1
    const repostsWeight = 3
    const repliesWeight = 5
    
    const rawScore = (
      post.likesCount * likesWeight +
      post.repostsCount * repostsWeight +
      post.repliesCount * repliesWeight
    )
    
    // Apply time decay to engagement
    const timeDecay = this.calculateRecencyScore(new Date(post.createdAt))
    let engagementScore = rawScore * (0.3 + 0.7 * timeDecay)
    
    // Boost for verified users
    if (post.author.isVerified) {
      engagementScore *= this.config.verifiedBoost
    }
    
    // Boost for media content
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      const mediaBoost = post.mediaType === 'video' ? 1.3 : 1.1
      engagementScore *= mediaBoost
    }
    
    // Normalize engagement score (log scale for large numbers)
    return Math.log10(engagementScore + 1) * 10
  }
  
  /**
   * Calculate user affinity score
   */
  calculateAffinityScore(
    post: PostWithScore,
    followingUsers: Set < string > ,
    userInteractions: Map < string, number >
  ): number {
    let affinityScore = 0
    
    // Following boost
    if (followingUsers.has(post.authorId)) {
      affinityScore += this.config.followingBoost
    }
    
    // Interaction history boost
    const interactionScore = userInteractions.get(post.authorId) || 0
    affinityScore += Math.min(interactionScore, 20) // Cap at 20
    
    // Content relevance based on hashtags and mentions
    if (post.hashtags && post.hashtags.length > 0) {
      affinityScore += post.hashtags.length * 0.5
    }
    
    if (post.mentions && post.mentions.length > 0) {
      affinityScore += post.mentions.length * 0.3
    }
    
    return affinityScore
  }
  
  /**
   * Calculate virality score based on engagement velocity
   */
  calculateViralityScore(post: PostWithScore): number {
    const now = Date.now()
    const postTime = new Date(post.createdAt).getTime()
    const hoursOld = Math.max((now - postTime) / (1000 * 60 * 60), 1)
    
    const totalEngagements = post.likesCount + post.repostsCount + post.repliesCount
    const engagementVelocity = totalEngagements / hoursOld
    
    // Viral thresholds
    if (engagementVelocity > 20) return engagementVelocity * 3
    if (engagementVelocity > 10) return engagementVelocity * 2
    if (engagementVelocity > 5) return engagementVelocity * 1.5
    
    return engagementVelocity
  }
  
  /**
   * Calculate diversity score to prevent monotony
   */
  calculateDiversityScore(
    post: PostWithScore,
    index: number,
    allPosts: PostWithScore[]
  ): number {
    const lookBackCount = 5
    const recentPosts = allPosts.slice(Math.max(0, index - lookBackCount), index)
    
    // Count same author appearances
    const sameAuthorCount = recentPosts.filter(p => p.authorId === post.authorId).length
    const sameMediaTypeCount = recentPosts.filter(p => p.mediaType === post.mediaType).length
    
    // Diversity penalty
    const authorPenalty = sameAuthorCount * 0.3
    const mediaTypePenalty = sameMediaTypeCount * 0.1
    
    return Math.max(0.1, 1 - authorPenalty - mediaTypePenalty)
  }
  
  /**
   * Calculate overall algorithmic score
   */
  calculateAlgorithmicScore(
    post: PostWithScore,
    index: number,
    allPosts: PostWithScore[],
    followingUsers: Set < string > ,
    userInteractions: Map < string, number >
  ): number {
    const recencyScore = this.calculateRecencyScore(new Date(post.createdAt))
    const engagementScore = this.calculateEngagementScore(post)
    const affinityScore = this.calculateAffinityScore(post, followingUsers, userInteractions)
    const viralityScore = this.calculateViralityScore(post)
    const diversityScore = this.calculateDiversityScore(post, index, allPosts)
    
    // Store individual scores for debugging
    post.recencyScore = recencyScore
    post.engagementScore = engagementScore
    post.affinityScore = affinityScore
    post.viralityScore = viralityScore
    post.diversityScore = diversityScore
    
    // Weighted combination
    const totalScore = (
      recencyScore * this.config.recencyWeight +
      engagementScore * this.config.engagementWeight +
      affinityScore * this.config.affinityWeight +
      viralityScore * this.config.viralityWeight +
      diversityScore * this.config.diversityWeight
    )
    
    return Math.max(0, totalScore)
  }
}

/**
 * Fetch user interactions for affinity calculation
 */
async function fetchUserInteractions(userId: string): Promise < Map < string, number >> {
  const interactions = new Map < string,
    number > ()
  
  try {
    // Get likes - each like = 1 point
    const likes = await Like.find({ userId })
      .populate('postId')
      .limit(500)
      .lean()
    
    for (const like of likes) {
      if (like.postId && typeof like.postId === 'object' && 'authorId' in like.postId) {
        const authorId = (like.postId as any).authorId
        interactions.set(authorId, (interactions.get(authorId) || 0) + 1)
      }
    }
    
    // Get reposts - each repost = 2 points
    const reposts = await Post.find({
        authorId: userId,
        isRepost: true,
        originalPostId: { $exists: true }
      })
      .populate('originalPostId')
      .limit(200)
      .lean()
    
    for (const repost of reposts) {
      if (repost.originalPostId && typeof repost.originalPostId === 'object' && 'authorId' in repost.originalPostId) {
        const authorId = (repost.originalPostId as any).authorId
        interactions.set(authorId, (interactions.get(authorId) || 0) + 2)
      }
    }
    
    // Get replies - each reply = 3 points
    const replies = await Post.find({
        authorId: userId,
        parentPostId: { $exists: true, $ne: null }
      })
      .populate('parentPostId')
      .limit(200)
      .lean()
    
    for (const reply of replies) {
      if (reply.parentPostId && typeof reply.parentPostId === 'object' && 'authorId' in reply.parentPostId) {
        const authorId = (reply.parentPostId as any).authorId
        interactions.set(authorId, (interactions.get(authorId) || 0) + 3)
      }
    }
    
  } catch (error) {
    console.error('Error fetching user interactions:', error)
  }
  
  return interactions
}

/**
 * Main timeline API endpoint
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    await connectDB()
    
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    const { searchParams } = new URL(request.url)
    const algorithm = searchParams.get("algorithm") || "algorithmic"
    
    
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit
    
    // Get following users
    const following = await Follow.find({ followerId: user._id }).select("followingId")
    const followingIds = following.map(f => f.followingId)
    followingIds.push(user._id.toString())
    
    // Fetch posts with expanded criteria for algorithmic mode
    let postQuery: any
    if (algorithm === "algorithmic") {
      postQuery = {
        $or: [
        {
          visibility: "public"
        },
        {
          visibility: { $exists: false }
        }],
        $or: [
          { authorId: { $in: followingIds } },
          // Include viral posts from non-followed users
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
    } else {
      // Chronological mode - only followed users
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
      .skip(skip)
      .limit(algorithm === "algorithmic" ? limit * 3 : limit) // Fetch more for algorithmic sorting
      .lean()
    
    // Get author information
    const authorIds = [...new Set(posts.map(post => post.authorId))]
    const authors = await User.find({
      _id: { $in: authorIds }
    }).select("_id username displayName avatarUrl isVerified").lean()
    
    const authorMap = new Map(authors.map(author => [author._id.toString(), author]))
    
    // Get user interactions for current user
    const postIds = posts.map(p => p._id.toString())
    const [likedPosts, repostedPosts, userInteractions] = await Promise.all([
      Like.find({
        userId: user._id.toString(),
        postId: { $in: postIds }
      }).select("postId").lean(),
      
      Post.find({
        authorId: user._id.toString(),
        isRepost: true,
        originalPostId: { $in: postIds }
      }).select("originalPostId").lean(),
      
      algorithm === "algorithmic" ? fetchUserInteractions(user._id.toString()) : Promise.resolve(new Map())
    ])
    
    const likedPostIds = new Set(likedPosts.map(like => like.postId.toString()))
    const repostedOriginalPostIds = new Set(repostedPosts.map(repost => repost.originalPostId?.toString()))
    
    // Format posts
    let formattedPosts: PostWithScore[] = posts.map(post => {
      const author = authorMap.get(post.authorId)
      
      return {
        ...post,
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
        isLiked: likedPostIds.has(post._id.toString()),
        isReposted: repostedOriginalPostIds.has(post._id.toString())
      }
    }).filter(post => post.author.id) // Filter out posts with missing authors
    if (algorithm === 'trending') {
      getTrendingPosts(request)
    }
    // Apply algorithm-specific sorting
    if (algorithm === "algorithmic") {
      const timelineAlgorithm = new TimelineAlgorithm()
      
      const followingSet = new Set(followingIds)
      
      // Calculate algorithmic scores
      formattedPosts = formattedPosts.map((post, index) => ({
        ...post,
        algorithmScore: timelineAlgorithm.calculateAlgorithmicScore(
          post,
          index,
          formattedPosts,
          followingSet,
          userInteractions
        )
      }))
      
      // Sort by algorithmic score
      formattedPosts.sort((a, b) => (b.algorithmScore || 0) - (a.algorithmScore || 0))
      
      // Apply final diversity filter
      formattedPosts = applyDiversityFilter(formattedPosts)
    }
    
    // Return final set limited to requested amount
    const finalPosts = formattedPosts.slice(0, limit)
    
    return NextResponse.json({
      posts: finalPosts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === (algorithm === "algorithmic" ? limit * 3 : limit)
      },
      algorithm,
      debug: process.env.NODE_ENV === 'development' ? {
        totalFetched: posts.length,
        totalFormatted: formattedPosts.length,
        finalCount: finalPosts.length
      } : undefined
    })
    
    
  } catch (error) {
    console.error("Timeline API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Apply final diversity filter to prevent monotony
 */
function applyDiversityFilter(posts: PostWithScore[]): PostWithScore[] {
  const filtered: PostWithScore[] = []
  const authorFrequency = new Map < string,
    number > ()
  const maxConsecutiveFromSameAuthor = 2
  
  for (const post of posts) {
    const authorCount = authorFrequency.get(post.authorId) || 0
    
    if (authorCount < maxConsecutiveFromSameAuthor || filtered.length < 5) {
      filtered.push(post)
      authorFrequency.set(post.authorId, authorCount + 1)
    } else {
      // Reset counter if we've moved past the consecutive limit
      const lastFewPosts = filtered.slice(-3)
      const recentSameAuthor = lastFewPosts.filter(p => p.authorId === post.authorId).length
      
      if (recentSameAuthor === 0) {
        filtered.push(post)
        authorFrequency.set(post.authorId, 1)
      }
    }
  }
  
  return filtered
}

// app/api/timeline/trending/route.ts
export async function getTrendingPosts(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const hoursBack = Number.parseInt(searchParams.get("hours") || "24")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    
    const cutoffTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000))
    
    const trendingPosts = await Post.aggregate([
    {
      $match: {
        createdAt: { $gte: cutoffTime },
        $or: [
        {
          visibility: "public"
        },
        {
          visibility: { $exists: false }
        }],
        $expr: {
          $gt: [
            { $add: ["$likesCount", "$repostsCount", "$repliesCount"] },
            3
          ]
        }
      }
    },
    {
      $addFields: {
        hoursOld: {
          $divide: [
            { $subtract: [new Date(), "$createdAt"] },
            3600000
          ]
        },
        engagementVelocity: {
          $divide: [
            { $add: ["$likesCount", { $multiply: ["$repostsCount", 2] }, { $multiply: ["$repliesCount", 3] }] },
            { $max: [{ $divide: [{ $subtract: [new Date(), "$createdAt"] }, 3600000] }, 1] }
          ]
        }
      }
    },
    {
      $sort: { engagementVelocity: -1 }
    },
    {
      $limit: limit
    }])
    
    // Populate author information
    const authorIds = trendingPosts.map(post => post.authorId)
    const authors = await User.find({
      _id: { $in: authorIds }
    }).select("_id username displayName avatarUrl isVerified").lean()
    
    const authorMap = new Map(authors.map(author => [author._id.toString(), author]))
    
    const formattedTrendingPosts = trendingPosts.map(post => {
      const author = authorMap.get(post.authorId)
      
      return {
        ...post,
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
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        engagementVelocity: post.engagementVelocity
      }
    })
    
    return NextResponse.json(formattedTrendingPosts)
    
  } catch (error) {
    console.error("Trending posts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}