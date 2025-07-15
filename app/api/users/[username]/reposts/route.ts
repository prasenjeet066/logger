import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import { Post } from "@/lib/mongodb/models/Post"

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    await connectDB()

    const user = await User.findOne({ username: params.username }).lean()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find reposts by this user
    const reposts = await Post.find({
      authorId: user._id.toString(),
      replyToId: { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    // Get original posts for reposts
    const originalPostIds = reposts.map((r) => r.replyToId).filter(Boolean)
    const originalPosts = await Post.find({ _id: { $in: originalPostIds } }).lean()
    const originalPostsMap = new Map(originalPosts.map((p) => [p._id.toString(), p]))

    // Get authors for original posts
    const authorIds = originalPosts.map((p) => p.authorId)
    const authors = await User.find({ _id: { $in: authorIds } }).lean()
    const authorsMap = new Map(authors.map((a) => [a._id.toString(), a]))

    const formattedReposts = reposts.map((repost) => {
      const originalPost = originalPostsMap.get(repost.replyToId!)
      const originalAuthor = originalPost ? authorsMap.get(originalPost.authorId) : null

      return {
        _id: originalPost?._id.toString() || repost._id.toString(),
        content: originalPost?.content || repost.content,
        createdAt: originalPost?.createdAt || repost.createdAt,
        authorId: originalPost?.authorId || repost.authorId,
        author: originalAuthor
          ? {
              id: originalAuthor._id.toString(),
              username: originalAuthor.username,
              displayName: originalAuthor.displayName,
              avatarUrl: originalAuthor.avatarUrl,
              isVerified: originalAuthor.isVerified,
            }
          : {
              id: user._id.toString(),
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              isVerified: user.isVerified,
            },
        likesCount: originalPost?.likesCount || 0,
        repliesCount: originalPost?.repliesCount || 0,
        repostsCount: originalPost?.repostsCount || 0,
        viewsCount: originalPost?.viewsCount || 0,
        mediaUrls: originalPost?.mediaUrls || repost.mediaUrls,
        mediaType: originalPost?.mediaType || repost.mediaType,
        isLiked: false,
        isReposted: false,
      }
    })

    return NextResponse.json(formattedReposts)
  } catch (error) {
    console.error("Error fetching user reposts:", error)
    return NextResponse.json({ error: "Failed to fetch reposts" }, { status: 500 })
  }
}
