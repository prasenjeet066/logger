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
      isRepost: true, // Ensure it's an actual repost
      originalPostId: { $exists: true }, // Must reference an original post
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    // Get original posts for reposts
    const originalPostIds = reposts.map((r) => r.originalPostId).filter(Boolean)
    const originalPosts = await Post.find({ _id: { $in: originalPostIds } }).lean()
    const originalPostsMap = new Map(originalPosts.map((p) => [p._id.toString(), p]))

    // Get authors for original posts and the reposting user
    const authorIds = [...new Set(originalPosts.map((p) => p.authorId).concat(user._id.toString()))]
    const authors = await User.find({ _id: { $in: authorIds } }).lean()
    const authorsMap = new Map(authors.map((a) => [a._id.toString(), a]))

    const formattedReposts = reposts
      .map((repost) => {
        const originalPost = originalPostsMap.get(repost.originalPostId!)
        const originalAuthor = originalPost ? authorsMap.get(originalPost.authorId) : null
        const repostingUser = authorsMap.get(repost.authorId) // This is 'user' from above

        if (!originalPost || !originalAuthor || !repostingUser) {
          // This case should ideally not happen if data integrity is maintained
          // but good to handle for robustness.
          return null
        }

        return {
          _id: originalPost._id.toString(),
          content: originalPost.content,
          createdAt: originalPost.createdAt.toISOString(),
          authorId: originalPost.authorId,
          author: {
            id: originalAuthor._id.toString(),
            username: originalAuthor.username,
            displayName: originalAuthor.displayName,
            avatarUrl: originalAuthor.avatarUrl,
            isVerified: originalAuthor.isVerified,
          },
          likesCount: originalPost.likesCount || 0,
          repliesCount: originalPost.repliesCount || 0,
          repostsCount: originalPost.repostsCount || 0,
          viewsCount: originalPost.viewsCount || 0, // Assuming viewsCount exists on Post model
          mediaUrls: originalPost.mediaUrls || [],
          mediaType: originalPost.mediaType || null,
          isLiked: false, // TODO: Check if current user liked this post
          isReposted: true, // This is a repost, so it's true for the current user's view
          repostedBy: repostingUser.username, // Add who reposted it
        }
      })
      .filter(Boolean) // Filter out any nulls if original post/author not found

    return NextResponse.json(formattedReposts)
  } catch (error) {
    console.error("Error fetching user reposts:", error)
    return NextResponse.json({ error: "Failed to fetch reposts" }, { status: 500 })
  }
}
