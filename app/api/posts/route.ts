import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
// Remove the incorrect import path - should be relative or from lib
// import Vote from "/lib/mongodb/models/Voting" // This path looks incorrect
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
    
    // Create post data with required fields
    const postData = {
      content: body.content,
      authorId: body.authorId || user._id.toString(),
      parentPostId: body.parentPostId || null,
      mediaUrls: body.mediaUrls || [],
      mediaType: body.mediaType || null,
      hashtags: body.hashtags || [],
      mentions: body.mentions || [],
      visibility: body.visibility || "public",
      isRepost: body.isRepost || false,
      originalPostId: body.originalPostId || null,
    }
    
    console.log("Creating post with data:", postData)
    
    // Validate with schema if it exists
    let validatedData
    try {
      validatedData = createPostSchema.parse(postData)
    } catch (validationError) {
      console.error("Validation error:", validationError)
      // If validation fails, try with minimal required data
      validatedData = {
        content: postData.content,
        authorId: postData.authorId,
        parentPostId: postData.parentPostId,
        mediaUrls: postData.mediaUrls,
        mediaType: postData.mediaType,
        hashtags: postData.hashtags,
        mentions: postData.mentions,
        visibility: postData.visibility,
      }
    }
    
    // Extract hashtags and mentions from content
    let hashtags = (validatedData.content.match(/#[a-zA-Z0-9_\u0980-\u09FF]+/g) || []).map((tag) =>
      tag.slice(1).toLowerCase(),
    )
    hashtags = [...new Set(hashtags)]
    
    const mentions = (validatedData.content.match(/@[a-zA-Z0-9_]+/g) || []).map((mention) =>
      mention.slice(1).toLowerCase(),
    )
    
    // Create new post
    const post = new Post({
      ...validatedData,
      hashtags,
      mentions,
    })
    
    // Handle review results if they exist
    if (body.reviewResults?.content) {
      try {
        const reviewData = JSON.parse(body.reviewResults.content)
        post.visibility = reviewData.isharmful ? "f-private" : body.visibility || "public"
      } catch (parseError) {
        console.warn("Failed to parse review results:", parseError)
        post.visibility = body.visibility || "public"
      }
    }
    
    await post.save()
    console.log("Post saved successfully:", post._id)
    
    // If it's a reply, increment repliesCount on the parent post
    if (post.parentPostId) {
      await Post.findByIdAndUpdate(post.parentPostId, { $inc: { repliesCount: 1 } })
      console.log("Updated parent post reply count")
    }
    
    // Update user's post count
    await User.findByIdAndUpdate(user._id, {
      $inc: { postsCount: 1 },
    })
    
    // Insert hashtags into PostHashtag collection
    if (hashtags.length > 0) {
      try {
        await Promise.all(
          hashtags.map((hashtag) =>
            new PostHashtag({
              postId: post._id.toString(),
              hashtagId: hashtag,
            }).save()
          )
        )
      } catch (hashtagError) {
        console.warn("Failed to save hashtags:", hashtagError)
      }
    }
    
    // Trigger cron job if the post has mentions (to process bot responses)
    if (mentions.length > 0) {
      // Fire and forget - don't wait for the cron job to complete
      triggerCronJob().catch(error => {
        console.error('Failed to trigger cron job:', error)
      })
    }
    
    // Populate author information for response
    const populatedPost = await Post.findById(post._id).lean()
    const author = await User.findById(user._id).select("username displayName avatarUrl isVerified").lean()
    
    const postResponse = {
      ...populatedPost,
      _id: populatedPost._id.toString(),
      createdAt: populatedPost.createdAt.toISOString(),
      updatedAt: populatedPost.updatedAt.toISOString(),
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
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: error.errors[0].message || "Validation failed",
        details: error.errors
      }, { status: 400 })
    }
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "Duplicate post detected" 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Failed to create post. Please try again." 
    }, { status: 500 })
  }
}