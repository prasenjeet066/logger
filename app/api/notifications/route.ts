import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { connectDB } from "@/lib/mongodb/connection"
import Notification from "@/lib/mongodb/models/Notification"
import { User } from "@/lib/mongodb/models/User"
import { Post } from "@/lib/mongodb/models/Post"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await connectDB()

    // Resolve current user
    const currentUser = await User.findOne({ email: session.user.email }).lean()
    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const notifications = await Notification.find({ userId: currentUser._id.toString() })
      .populate({
        path: "fromUserId",
        select: "username displayName avatarUrl",
        model: User,
      })
      .populate({
        path: "postId",
        select: "content",
        model: Post,
      })
      .sort({ createdAt: -1 })
      .lean()

    const formatted = notifications.map((n: any) => ({
      id: n._id.toString(),
      type: n.type,
      created_at: n.createdAt,
      from_user: n.fromUserId
        ? {
            id: n.fromUserId._id?.toString?.() || n.fromUserId._id || n.fromUserId,
            username: n.fromUserId.username,
            display_name: n.fromUserId.displayName,
            avatar_url: n.fromUserId.avatarUrl || null,
          }
        : null,
      post: n.postId
        ? {
            id: n.postId._id?.toString?.() || n.postId._id || n.postId,
            content: n.postId.content,
          }
        : undefined,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
