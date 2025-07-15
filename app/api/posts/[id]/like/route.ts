import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Like } from "@/lib/mongodb/models/Like"
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
    const userId = user._id.toString()

    // Check if like already exists
    const existingLike = await Like.findOne({ userId, postId })

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ userId, postId })
      await Post.findByIdAndUpdate(postId, {
        $inc: { likesCount: -1 },
      })

      return NextResponse.json({ liked: false })
    } else {
      // Like
      await Like.create({ userId, postId })
      await Post.findByIdAndUpdate(postId, {
        $inc: { likesCount: 1 },
      })

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}
