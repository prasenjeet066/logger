import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"
import { Follow } from "@/lib/mongodb/models/Follow"
import { Like } from "@/lib/mongodb/models/Like"
import { PostHashtag } from '@/lib/mongodb/models/PostHashtag'
import { z } from "zod"
import { createPostSchema } from "@/lib/validations/post"

// Helper function to call the cron job
async function triggerCronJob() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    const cronUrl = `${baseUrl}/api/cron-job`
    
    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.error('Failed to trigger cron job:', response.statusText)
    } else {
      console.log('Cron job triggered successfully')
    }
  } catch (error) {
    console.error('Error triggering cron job:', error)
  }
}

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
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit
    
    // Get user's following list
    const following = await Follow.find({ followerId: user._id }).select("followingId")
    const followingIds = following.map((f) => f.followingId)
    followingIds.push(user._id.toString()) // Include user's own posts
    
    // Get posts from followed users and own posts
    const posts = await Post.find({
        authorId: { $in: followingIds },
        visibility: { $in: ["public", undefined, null] } // Only show public posts in feed
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Get author information for each post
    const authorIds = [...new Set(posts.map((post) => post.authorId))]
    const authors = await User.find({
        _id: { $in: authorIds },
      })
      .select("_id username displayName avatarUrl isVerified")
      .lean()
    
    const authorMap = new Map(authors.map((author) => [author._id.toString(), author]))
    
    // Get liked status for current user for all fetched posts
    const postIds = posts.map((p) => p._id.toString())
    const likedPosts = await Like.find({
        userId: user._id.toString(),
        postId: { $in: postIds },
      })
      .select("postId")
      .lean()
    const likedPostIds = new Set(likedPosts.map((like) => like.postId.toString()))
    
    // Get reposted status for current user for all fetched posts
    const repostedPosts = await Post.find({
        authorId: user._id.toString(),
        isRepost: true,
        originalPostId: { $in: postIds },
      })
      .select("originalPostId")
      .lean()
    const repostedOriginalPostIds = new Set(repostedPosts.map((repost) => repost.originalPostId?.toString()))
    
    // Format posts with author information and interaction status
    const formattedPosts = posts
      .map((post) => {
        const author = authorMap.get(post.authorId)
        const isLiked = likedPostIds.has(post._id.toString())
        const isReposted = repostedOriginalPostIds.has(post._id.toString())
        
        return {
          ...post,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          author: author ? {
            id: author._id.toString(),
            username: author.username,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
            isVerified: author.isVerified,
          } : null,
          isLiked,
          isReposted,
        }
      })
      .filter(Boolean) // Filter out any null authors
    
    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error("Get posts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    
    const body = await request.json()
    console.log("Received request body:", body)
    
    // Validate the request body structure
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json({ 
        error: "Content is required and must be a string" 
      }, { status: 400 })
    }

    // Extract hashtags and mentions from content
    let hashtags = (body.content.match(/#[a-zA-Z0-9_\u0980-\u09FF]+/g) || []).map((tag) =>
      tag.slice(1).toLowerCase(),
    )
    hashtags = [...new Set(hashtags)]
    
    const mentions = (body.content.match(/@[a-zA-Z0-9_]+/g) || []).map((mention) =>
      mention.slice(1).toLowerCase(),
    )
    
    // Create post data with required fields - matching your Post model
    const postData = {
      content: body.content.trim(),
      authorId: user._id.toString(), // Use authenticated user's ID
      parentPostId: body.parentPostId || null,
      mediaUrls: Array.isArray(body.mediaUrls) ? body.mediaUrls : [],
      mediaType: body.mediaType || null,
      hashtags: hashtags,
      mentions: mentions,
      visibility: body.visibility || "public",
      isRepost: Boolean(body.isRepost),
      originalPostId: body.originalPostId || null,
      // Add fields from your Post model that might be missing
      likesCount: 0,
      repostsCount: 0,
      repliesCount: 0,
      watch: 0,
      isPinned: false,
      processed: false,
      reviewResults: body.reviewResults || null,
      restrictions: null,
      imageNSFW: body.imageNSFW || null,
      watchedBy: []
    }
    
    console.log("Creating post with data:", postData)
    
    // Simple validation for required fields
    if (!postData.content.trim()) {
      return NextResponse.json({ 
        error: "Content cannot be empty" 
      }, { status: 400 })
    }

    if (postData.content.length > 380) { // Updated to match your frontend limit
      return NextResponse.json({ 
        error: "Content exceeds maximum length of 380 characters" 
      }, { status: 400 })
    }
    
    // Handle review results if they exist
    if (body.reviewResults?.content) {
      try {
        const reviewData = JSON.parse(body.reviewResults.content)
        postData.visibility = reviewData.isharmful ? "f-private" : (body.visibility || "public")
      } catch (parseError) {
        console.warn("Failed to parse review results:", parseError)
        postData.visibility = body.visibility || "public"
      }
    }
    
    // Create new post directly
    const post = new Post(postData)
    await post.save()
    
    console.log("Post saved successfully:", post._id)
    
    // If it's a reply, increment repliesCount on the parent post
    if (post.parentPostId) {
      try {
        await Post.findByIdAndUpdate(post.parentPostId, { $inc: { repliesCount: 1 } })
        console.log("Updated parent post reply count")
      } catch (parentUpdateError) {
        console.warn("Failed to update parent post:", parentUpdateError)
        // Don't fail the entire operation for this
      }
    }
    
    // Update user's post count
    try {
      await User.findByIdAndUpdate(user._id, {
        $inc: { postsCount: 1 },
      })
    } catch (userUpdateError) {
      console.warn("Failed to update user post count:", userUpdateError)
      // Don't fail the entire operation for this
    }
    
    // Insert hashtags into PostHashtag collection
    if (hashtags.length > 0) {
      try {
        await Promise.all(
          hashtags.map(async (hashtag) => {
            try {
              return await new PostHashtag({
                postId: post._id.toString(),
                hashtagId: hashtag,
              }).save()
            } catch (hashtagError) {
              console.warn(`Failed to save hashtag ${hashtag}:`, hashtagError)
              return null
            }
          })
        )
      } catch (hashtagError) {
        console.warn("Failed to save some hashtags:", hashtagError)
      }
    }
    
    // Trigger cron job if the post has mentions (to process bot responses)
    if (mentions.length > 0) {
      // Fire and forget - don't wait for the cron job to complete
      triggerCronJob().catch(error => {
        console.error('Failed to trigger cron job:', error)
      })
    }
    
    // Get fresh post data for response
    const savedPost = await Post.findById(post._id).lean()
    const author = await User.findById(user._id).select("username displayName avatarUrl isVerified").lean()
    
    const postResponse = {
      ...savedPost,
      _id: savedPost._id.toString(),
      createdAt: savedPost.createdAt.toISOString(),
      updatedAt: savedPost.updatedAt.toISOString(),
      author: author ? {
        id: author._id.toString(),
        username: author.username,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
        isVerified: author.isVerified,
      } : null,
      isLiked: false, // Newly created post is not liked by default
      isReposted: false, // Newly created post is not reposted by default
    }
    
    return NextResponse.json(postResponse, { status: 201 })
  } catch (error) {
    console.error("Create post error:", error)
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Validation failed: " + error.errors[0].message,
        details: error.errors
      }, { status: 400 })
    }
    
    // Handle MongoDB errors
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]
      return NextResponse.json({ 
        error: "Database validation failed: " + (firstError?.message || "Invalid data")
      }, { status: 400 })
    }
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "Duplicate post detected" 
      }, { status: 409 })
    }

    // Handle MongoDB connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return NextResponse.json({ 
        error: "Database connection failed. Please try again." 
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: "Failed to create post. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}