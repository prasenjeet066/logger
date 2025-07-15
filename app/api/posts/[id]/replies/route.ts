import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const postId = params.id

    const replies = await Post.find({ parentPostId: postId })
      .sort({ createdAt: 1 }) // Sort by creation date for chronological replies
      .lean()

    // Get author information for each reply
    const authorIds = [...new Set(replies.map((reply) => reply.authorId))]
    const authors = await User.find({
      _id: { $in: authorIds },
    })
      .select("_id username displayName avatarUrl isVerified")
      .lean()

    const authorMap = new Map(authors.map((author) => [author._id.toString(), author]))

    // Format replies with author information
    const formattedReplies = replies.map((reply) => ({
      ...reply,
      _id: reply._id.toString(),
      author: authorMap.get(reply.authorId),
      isLiked: false, // TODO: Check if current user liked this reply
      isReposted: false, // TODO: Check if current user reposted this reply
    }))

    return NextResponse.json(formattedReplies)
  } catch (error) {
    console.error("Error fetching replies:", error)
    return NextResponse.json({ error: "Failed to fetch replies" }, { status: 500 })
  }
}
