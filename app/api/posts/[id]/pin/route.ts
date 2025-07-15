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

    const postId = params.id
    const post = await Post.findById(postId)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Only the author can pin their own post
    if (post.authorId !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden: Not your post" }, { status: 403 })
    }

    // Toggle isPinned status
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $set: { isPinned: !post.isPinned } },
      { new: true },
    ).lean()

    return NextResponse.json({ isPinned: updatedPost?.isPinned })
  } catch (error) {
    console.error("Error toggling pin status:", error)
    return NextResponse.json({ error: "Failed to toggle pin status" }, { status: 500 })
  }
}
