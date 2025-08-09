import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { connectDB } from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"
import { Like } from "@/lib/mongodb/models/Like"

interface Params {
  id: string
  filter?: "relevant" | "recently" | "forceView"
  _id?: string // id of this comment to force view
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
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

    // Base query: find all replies to the given post
    const query: any = { parentPostId: params.id }

    // If forceView is active, ensure the specific reply appears
    let forcedReply: any = null
    if (params.filter === "forceView" && params._id) {
      forcedReply = await Post.findById(params._id).lean()
    }

    let sortOption: any = { createdAt: -1 } // default: recently
    if (params.filter === "relevant") {
      sortOption = { likesCount: -1, createdAt: -1 }
    }

    const replies = await Post.find(query).sort(sortOption).lean()

    // Add forced reply to top if not already included
    if (forcedReply && !replies.find((r) => r._id.toString() === forcedReply._id.toString())) {
      replies.unshift(forcedReply)
    }

    // Format replies with author info & like status
    const formattedReplies = await Promise.all(
      replies.map(async (reply) => {
        const author = await User.findById(reply.authorId).lean()
        if (!author) return null

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
          mediaType: reply.mediaType || null,
          likesCount: reply.likesCount || 0,
          repostsCount: reply.repostsCount || 0,
          repliesCount: reply.repliesCount || 0,
          isRepost: reply.isRepost || false,
          originalPostId: reply.originalPostId || null,
          parentPostId: reply.parentPostId || null,
          hashtags: reply.hashtags || [],
          mentions: reply.mentions || [],
          isPinned: reply.isPinned || false,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
          isLiked: !!isLiked,
        }
      })
    )

    const validReplies = formattedReplies.filter(Boolean)

    return NextResponse.json(validReplies, { status: 200 })
  } catch (error) {
    console.error("Error fetching replies:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}