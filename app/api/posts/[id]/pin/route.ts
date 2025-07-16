import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { connectToDatabase } from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const post = await Post.findById(params.id)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Only the author can pin/unpin their post
    if (post.authorId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Toggle pin status
    post.isPinned = !post.isPinned
    await post.save()

    return NextResponse.json({
      success: true,
      isPinned: post.isPinned,
    })
  } catch (error) {
    console.error("Error toggling pin status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
