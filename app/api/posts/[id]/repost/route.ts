import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const originalPostId = params.id
    const originalPost = await Post.findById(originalPostId)

    if (!originalPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Create repost
    const repost = await Post.create({
      content: `RT @${originalPost.authorId}: ${originalPost.content}`,
      authorId: user._id.toString(),
      replyToId: originalPostId,
    })

    // Update original post's repost count
    await Post.findByIdAndUpdate(originalPostId, {
      $inc: { repostsCount: 1 },
    })

    return NextResponse.json({
      ...repost.toObject(),
      _id: repost._id.toString(),
      author: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error("Error creating repost:", error)
    return NextResponse.json({ error: "Failed to create repost" }, { status: 500 })
  }
}
