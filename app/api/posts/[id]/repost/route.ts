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

    // Check if this user has already reposted this post
    const existingRepost = await Post.findOne({
      authorId: user._id.toString(),
      originalPostId: originalPostId,
      isRepost: true,
    })

    if (existingRepost) {
      // If already reposted, "unrepost" by deleting the repost entry
      await Post.deleteOne({ _id: existingRepost._id })
      await Post.findByIdAndUpdate(originalPostId, {
        $inc: { repostsCount: -1 },
      })
      return NextResponse.json({ reposted: false })
    } else {
      // Create repost
      const repost = await Post.create({
        content: originalPost.content, // Repost content can be the same as original
        authorId: user._id.toString(),
        originalPostId: originalPostId,
        isRepost: true,
        mediaUrls: originalPost.mediaUrls, // Include media from original post
        mediaType: originalPost.mediaType,
      })

      // Update original post's repost count
      await Post.findByIdAndUpdate(originalPostId, {
        $inc: { repostsCount: 1 },
      })

      // Populate author for the response
      const populatedRepost = await Post.findById(repost._id).lean()
      const author = await User.findById(user._id).select("username displayName avatarUrl isVerified").lean()

      return NextResponse.json({
        ...populatedRepost,
        _id: populatedRepost._id.toString(),
        author: {
          id: author?._id.toString(),
          username: author?.username,
          displayName: author?.displayName,
          avatarUrl: author?.avatarUrl,
          isVerified: author?.isVerified,
        },
        isReposted: true,
      })
    }
  } catch (error) {
    console.error("Error toggling repost:", error)
    return NextResponse.json({ error: "Failed to toggle repost" }, { status: 500 })
  }
}
