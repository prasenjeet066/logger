import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const replies = await Post.find({ parentPostId: params.id })
      .populate("authorId", "username displayName avatarUrl isVerified")
      .sort({ createdAt: 1 })
      .lean()

    const formattedReplies = replies.map((reply) => ({
      _id: reply._id.toString(),
      content: reply.content,
      authorId: reply.authorId._id.toString(),
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      likesCount: reply.likesCount || 0,
      repliesCount: reply.repliesCount || 0,
      repostsCount: reply.repostsCount || 0,
      viewsCount: reply.viewsCount || 0,
      mediaUrls: reply.mediaUrls || [],
      mediaType: reply.mediaType,
      isRepost: reply.isRepost || false,
      originalPostId: reply.originalPostId?.toString(),
      parentPostId: reply.parentPostId?.toString(),
      hashtags: reply.hashtags || [],
      mentions: reply.mentions || [],
      isPinned: reply.isPinned || false,
      author: {
        id: reply.authorId._id.toString(),
        username: reply.authorId.username,
        displayName: reply.authorId.displayName,
        avatarUrl: reply.authorId.avatarUrl,
        isVerified: reply.authorId.isVerified || false,
      },
      isLiked: false, // TODO: Check if current user liked this reply
      isReposted: false, // TODO: Check if current user reposted this reply
    }))

    return NextResponse.json(formattedReplies)
  } catch (error) {
    console.error("Error fetching replies:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
