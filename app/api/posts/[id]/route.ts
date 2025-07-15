import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"
import { Like } from "@/lib/mongodb/models/Like" // To delete associated likes

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

    // If it was an original post that was reposted, decrement repostsCount on itself
    // and delete all associated reposts (posts where originalPostId points to this post)
    if (!post.isRepost) {
      // Only if it's an original post
      await Post.updateMany(
        { originalPostId: postId, isRepost: true },
        { $set: { originalPostId: null, content: "[Original post deleted]", mediaUrls: [], mediaType: null } },
      )
      // Or, if you want to delete the reposts entirely:
      // await Post.deleteMany({ originalPostId: postId, isRepost: true });
    }

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
