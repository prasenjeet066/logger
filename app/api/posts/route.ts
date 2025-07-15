import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const posts = await Post.find().sort({ createdAt: -1 }).limit(20).lean()

    // Get user details for each post
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findById(post.authorId).lean()
        return {
          ...post,
          _id: post._id.toString(),
          author: user
            ? {
                id: user._id.toString(),
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                isVerified: user.isVerified,
              }
            : null,
        }
      }),
    )

    return NextResponse.json(postsWithUsers)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, replyToId, mediaUrls, mediaType } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const post = await Post.create({
      content,
      authorId: user._id.toString(),
      replyToId,
      mediaUrls,
      mediaType,
    })

    // Update user's posts count
    await User.findByIdAndUpdate(user._id, {
      $inc: { postsCount: 1 },
    })

    // If this is a reply, update the parent post's replies count
    if (replyToId) {
      await Post.findByIdAndUpdate(replyToId, {
        $inc: { repliesCount: 1 },
      })
    }

    return NextResponse.json({
      ...post.toObject(),
      _id: post._id.toString(),
      author: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
