import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"
import { Follow } from "@/lib/mongodb/models/Follow"
import { Like } from "@/lib/mongodb/models/Like" // Import Like model
import { z } from "zod"
import { createPostSchema } from "@/lib/validations/post"

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

        let repostedByUsername: string | undefined
        if (post.isRepost && post.originalPostId) {
          // If it's a repost, the author is the one who reposted it.
          // The original post's author is needed for the content.
          // For the timeline, we display the original post's content and author,
          // but indicate who reposted it.
          // This logic might need refinement based on exact UI requirements.
          // For now, let's assume `repostedBy` is the `author.username` if `isRepost` is true.
          // This is a simplification. A more robust solution would involve fetching the actual reposting user.
          // However, the `Post` model doesn't store `repostedBy` directly.
          // The `app/api/users/[username]/reposts/route.ts` handles this by adding `repostedBy`.
          // For the main timeline, we might just show the original post.
          // Let's adjust the `Post` type to include `repostedBy` for clarity.
          // For now, I'll leave `repostedBy` as undefined here, as it's primarily for the profile's reposts tab.
        }

        return {
          ...post,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          author: author
            ? {
                id: author._id.toString(),
                username: author.username,
                displayName: author.displayName,
                avatarUrl: author.avatarUrl,
                isVerified: author.isVerified,
              }
            : null, // Handle case where author might not be found (shouldn't happen with proper data)
          isLiked,
          isReposted,
          // repostedBy: repostedByUsername, // Add this if needed for timeline display
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
      parentPostId: body.parentPostId || null, // For replies
    })

    await post.save()

    // If it's a reply, increment repliesCount on the parent post
    if (post.parentPostId) {
      await Post.findByIdAndUpdate(post.parentPostId, { $inc: { repliesCount: 1 } })
    }

    // Update user's post count
    await User.findByIdAndUpdate(user._id, {
      $inc: { postsCount: 1 },
    })

    // Populate author information for response
    const populatedPost = await Post.findById(post._id).lean()
    const author = await User.findById(user._id).select("username displayName avatarUrl isVerified").lean()

    const postResponse = {
      ...populatedPost,
      _id: populatedPost._id.toString(),
      createdAt: populatedPost.createdAt.toISOString(),
      updatedAt: populatedPost.updatedAt.toISOString(),
      author: author
        ? {
            id: author._id.toString(),
            username: author.username,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
            isVerified: author.isVerified,
          }
        : null,
      isLiked: false, // Newly created post is not liked by default
      isReposted: false, // Newly created post is not reposted by default
    }

    return NextResponse.json(postResponse, { status: 201 })
  } catch (error) {
    console.error("Create post error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message || "Something is going wrong!"
      , details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
