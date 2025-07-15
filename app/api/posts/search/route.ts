import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"
import { Like } from "@/lib/mongodb/models/Like"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json([])
    }

    await connectDB()

    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Search posts by content
    const posts = await Post.find({
      content: { $regex: query, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    // Get authors for posts
    const authorIds = posts.map((p) => p.authorId)
    const authors = await User.find({ _id: { $in: authorIds } }).lean()
    const authorsMap = new Map(authors.map((a) => [a._id.toString(), a]))

    // Get like status for current user
    const postIds = posts.map((p) => p._id.toString())
    const likes = await Like.find({
      userId: currentUser._id.toString(),
      postId: { $in: postIds },
    }).lean()
    const likedPostIds = new Set(likes.map((l) => l.postId))

    const formattedPosts = posts.map((post) => {
      const author = authorsMap.get(post.authorId)

      return {
        _id: post._id.toString(),
        content: post.content,
        createdAt: post.createdAt,
        authorId: post.authorId,
        author: author
          ? {
              id: author._id.toString(),
              username: author.username,
              displayName: author.displayName,
              avatarUrl: author.avatarUrl,
              isVerified: author.isVerified,
            }
          : null,
        likesCount: post.likesCount,
        repliesCount: post.repliesCount,
        repostsCount: post.repostsCount,
        viewsCount: post.viewsCount,
        mediaUrls: post.mediaUrls,
        mediaType: post.mediaType,
        isLiked: likedPostIds.has(post._id.toString()),
        isReposted: false, // TODO: Implement repost check
      }
    })

    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error("Error searching posts:", error)
    return NextResponse.json({ error: "Failed to search posts" }, { status: 500 })
  }
}
