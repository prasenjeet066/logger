import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { connectDB } from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"
import { Like } from "@/lib/mongodb/models/Like"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find all replies to this post
    const replies = await Post.find({
      parentPostId: params.id,
    })
      .sort({ createdAt: -1 })
      .lean()

    // Get author information for each reply and check likes
    const formattedReplies = await Promise.all(
      replies.map(async (reply) => {
        const author = await User.findById(reply.authorId).lean()
        if (!author) return null

        // Check if current user liked this reply
        const isLiked = await Like.findOne({
          userId: currentUser._id.toString(),
          postId: reply._id.toString(),
        }).lean()

        return {
          _id: reply._id.toString(),
          content: reply.content,
          authorId: reply.authorId,
          author: {
            _id: author._id.toString(),
            username: author.username,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
            isVerified: author.isVerified || false,
          },
          mediaUrls: reply.mediaUrls || [],
          mediaType: reply.mediaType,
          likesCount: reply.likesCount || 0,
          repostsCount: reply.repostsCount || 0,
          repliesCount: reply.repliesCount || 0,
          isRepost: reply.isRepost || false,
          originalPostId: reply.originalPostId,
          parentPostId: reply.parentPostId,
          hashtags: reply.hashtags || [],
          mentions: reply.mentions || [],
          isPinned: reply.isPinned || false,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
          isLiked: !!isLiked,
        }
      }),
    )

    // Filter out null values (replies with missing authors)
    const validReplies = formattedReplies.filter((reply) => reply !== null)

    return NextResponse.json(validReplies)
  } catch (error) {
    console.error("Error fetching replies:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
