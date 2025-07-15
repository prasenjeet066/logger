import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import { Follow } from "@/lib/mongodb/models/Follow"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json([])
    }

    await connectDB()

    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Search users by username or display name
    const users = await User.find({
      $or: [{ username: { $regex: query, $options: "i" } }, { displayName: { $regex: query, $options: "i" } }],
    })
      .limit(20)
      .lean()

    // Get follow status for each user
    const userIds = users.map((u) => u._id.toString())
    const followingData = await Follow.find({
      followerId: currentUser._id.toString(),
      followingId: { $in: userIds },
    }).lean()

    const followingSet = new Set(followingData.map((f) => f.followingId))

    const usersWithFollowStatus = users.map((user) => ({
      _id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      followersCount: user.followersCount,
      isFollowing: followingSet.has(user._id.toString()),
      isVerified: user.isVerified,
    }))

    return NextResponse.json(usersWithFollowStatus)
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}
