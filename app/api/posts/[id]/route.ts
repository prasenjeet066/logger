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

    // Find the post and populate author information
    const post = await Post.findById(params.id).lean()
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Get author information
    const author = await User.findById(post.authorId).lean()
    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 })
    }

    // Check if current user liked this post
    const isLiked = await Like.findOne({
      userId: currentUser._id.toString(),
      postId: params.id,
    }).lean()

    // If it's a repost, get the original post
    let originalPost = null
    if (post.isRepost && post.originalPostId) {
      originalPost = await Post.findById(post.originalPostId).lean()
      if (originalPost) {
        const originalAuthor = await User.findById(originalPost.authorId).lean()
        if (originalAuthor) {
          originalPost.author = {
            _id: originalAuthor._id.toString(),
            username: originalAuthor.username,
            displayName: originalAuthor.displayName,
            avatarUrl: originalAuthor.avatarUrl,
            isVerified: originalAuthor.isVerified || false,
          }
        }
      }
    }

    // Format the response
    const formattedPost = {
      _id: post._id.toString(),
      content: post.content,
      authorId: post.authorId,
      author: {
        _id: author._id.toString(),
        username: author.username,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
        isVerified: author.isVerified || false,
      },
      mediaUrls: post.mediaUrls || [],
      mediaType: post.mediaType,
      likesCount: post.likesCount || 0,
      repostsCount: post.repostsCount || 0,
      repliesCount: post.repliesCount || 0,
      isRepost: post.isRepost || false,
      originalPostId: post.originalPostId,
      originalPost: originalPost,
      parentPostId: post.parentPostId,
      hashtags: post.hashtags || [],
      mentions: post.mentions || [],
      isPinned: post.isPinned || false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isLiked: !!isLiked,
    }

    return NextResponse.json(formattedPost)
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const postId = params.id
    const post = await Post.findById(postId)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Only the author can delete their own post
    if (post.authorId !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden: Not your post" }, { status: 403 })
    }

    // Delete the post
    await Post.deleteOne({ _id: postId })

    // Decrement user's post count
    await User.findByIdAndUpdate(user._id, { $inc: { postsCount: -1 } })

    // Delete associated likes
    await Like.deleteMany({ postId: postId })

    // If it was a reply, decrement repliesCount on its parent post
    if (post.parentPostId) {
      await Post.findByIdAndUpdate(post.parentPostId, { $inc: { repliesCount: -1 } })
    }

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
