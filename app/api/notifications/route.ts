import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { connectDB } from "@/lib/mongodb/connection"
import { Notification } from "@/lib/mongodb/models/Notification"
import { User } from "@/lib/mongodb/models/User"
import { Post } from "@/lib/mongodb/models/Post"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Get notifications for the current user
    const notifications = await Notification.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get user information for fromUserId
    const fromUserIds = [...new Set(notifications.map((n) => n.fromUserId))]
    const fromUsers = await User.find({
      _id: { $in: fromUserIds },
    })
      .select("_id username displayName avatarUrl isVerified")
      .lean()

    const fromUserMap = new Map(fromUsers.map((user) => [user._id.toString(), user]))

    // Get post information for notifications that reference posts
    const postIds = notifications.filter((n) => n.postId).map((n) => n.postId)
    const posts = await Post.find({
      _id: { $in: postIds },
    })
      .select("_id content")
      .lean()

    const postMap = new Map(posts.map((post) => [post._id.toString(), post]))

    // Format notifications with user and post information
    const formattedNotifications = notifications.map((notification) => ({
      ...notification,
      fromUser: fromUserMap.get(notification.fromUserId),
      post: notification.postId ? postMap.get(notification.postId) : null,
    }))

    return NextResponse.json(formattedNotifications)
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
