import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"
import { Follow } from "@/lib/mongodb/models/Follow"
import { createPostSchema } from "@/lib/validations/post"
import { z } from "zod"

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

    // Format posts with author information
    const formattedPosts = posts.map((post) => ({
      ...post,
      author: authorMap.get(post.authorId),
      isLiked: false, // TODO: Check if current user liked this post
      isReposted: false, // TODO: Check if current user reposted this post
    }))

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
    const validatedData = createPostSchema.parse(body)

    // Extract hashtags and mentions
    const hashtags = (validatedData.content.match(/#[a-zA-Z0-9_\u0980-\u09FF]+/g) || []).map((tag) =>
      tag.slice(1).toLowerCase(),
    )

    const mentions = (validatedData.content.match(/@[a-zA-Z0-9_]+/g) || []).map((mention) =>
      mention.slice(1).toLowerCase(),
    )

    // Create new post
    const post = new Post({
      content: validatedData.content,
      authorId: user._id.toString(),
      mediaUrls: body.mediaUrls || [],
      mediaType: body.mediaType || null,
      hashtags,
      mentions,
    })

    await post.save()

    // Update user's post count
    await User.findByIdAndUpdate(user._id, {
      $inc: { postsCount: 1 },
    })

    // Populate author information for response
    const populatedPost = await Post.findById(post._id).lean()
    const author = await User.findById(user._id).select("username displayName avatarUrl isVerified").lean()

    const postResponse = {
      ...populatedPost,
      author,
      isLiked: false,
      isReposted: false,
    }

    return NextResponse.json(postResponse, { status: 201 })
  } catch (error) {
    console.error("Create post error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
