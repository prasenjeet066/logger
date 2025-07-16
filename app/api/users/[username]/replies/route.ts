import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import { Post } from "@/lib/mongodb/models/Post"
import { Like } from "@/lib/mongodb/models/Like"

// Helper function to format posts with author and interaction status
async function formatPostsWithInteractionStatus(posts: any[], currentUserId: string | null) {
  const authorIds = [...new Set(posts.map((post) => post.authorId))]
  const authors = await User.find({ _id: { $in: authorIds } })
    .select("_id username displayName avatarUrl isVerified")
    .lean()
  const authorMap = new Map(authors.map((author) => [author._id.toString(), author]))

  const postIds = posts.map((p) => p._id.toString())
  let likedPostIds = new Set<string>()
  let repostedOriginalPostIds = new Set<string>()

  if (currentUserId) {
    const likedPosts = await Like.find({ userId: currentUserId, postId: { $in: postIds } })
      .select("postId")
      .lean()
    likedPostIds = new Set(likedPosts.map((like) => like.postId.toString()))

    const repostedPosts = await Post.find({
      authorId: currentUserId,
      isRepost: true,
      originalPostId: { $in: postIds },
    })
      .select("originalPostId")
      .lean()
    repostedOriginalPostIds = new Set(repostedPosts.map((repost) => repost.originalPostId?.toString()))
  }

  return posts
    .map((post) => {
      const author = authorMap.get(post.authorId)
      if (!author) return null

      return {
        ...post,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        author: {
          id: author._id.toString(),
          username: author.username,
          displayName: author.displayName,
          avatarUrl: author.avatarUrl,
          isVerified: author.isVerified,
        },
        isLiked: likedPostIds.has(post._id.toString()),
        isReposted: repostedOriginalPostIds.has(post._id.toString()),
      }
    })
    .filter(Boolean)
}

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    await connectDB()

    const session = await getServerSession(authOptions)
    let currentUserId: string | null = null
    if (session?.user?.email) {
      const currentUser = await User.findOne({ email: session.user.email }).select("_id").lean()
      currentUserId = currentUser?._id.toString() || null
    }

    const targetUser = await User.findOne({ username: params.username }).select("_id").lean()
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const replies = await Post.find({
      authorId: targetUser._id.toString(),
      parentPostId: { $ne: null }, // Only replies
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    const formattedReplies = await formatPostsWithInteractionStatus(replies, currentUserId)

    return NextResponse.json(formattedReplies)
  } catch (error) {
    console.error("Error fetching user replies:", error)
    return NextResponse.json({ error: "Failed to fetch user replies" }, { status: 500 })
  }
}
