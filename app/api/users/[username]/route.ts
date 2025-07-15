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

    const posts = await Post.find({ authorId: user._id.toString() }).sort({ createdAt: -1 }).limit(20).lean()

    return NextResponse.json({
      user: {
        ...user,
        _id: user._id.toString(),
      },
      posts: posts.map((post) => ({
        ...post,
        _id: post._id.toString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
