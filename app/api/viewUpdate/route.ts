import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { getServerSession } from "next-auth" // if you use NextAuth
import { authOptions } from "@/lib/auth/auth-config" // adjust path to your auth config

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json()
    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 })
    }
    
    // Get user session (you must be logged in to count unique watch)
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id
    
    await connectDB()
    
    // Find the post
    const post = await Post.findById(postId).select("watch watchedBy")
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    
    // Check if user already watched
    const updated = await Post.findOneAndUpdate({ _id: postId, watchedBy: { $ne: userId } },
    {
      $addToSet: { watchedBy: userId },
      $inc: { watch: 1 }
    }, { new: true })
    
    return NextResponse.json({ watch: updated?.watch ?? post.watch }, { status: 200 })
    
    
  } catch (error) {
    console.error("Error increasing watch count:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}