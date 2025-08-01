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
    
    await connectDB()
    
    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Get users that the current user is not following
    const followingIds = await Follow.find({ followerId: currentUser._id.toString() }).select("followingId").lean()
    
    const followingIdStrings = followingIds.map((f) => f.followingId)
    followingIdStrings.push(currentUser._id.toString()) // Exclude self
    
    const suggestedUsers = await User.find({
        _id: { $nin: followingIdStrings },
        show_in_search: { $ne: false },
      })
      .sort({ followersCount: -1 })
      .limit(6)
      .lean();
    
    // Check if current user is following any of these users
    const usersWithFollowStatus = suggestedUsers.map((user) => ({
      _id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      followersCount: user.followersCount,
      isFollowing: false,
      isVerified: user.isVerified,
    }))
    
    return NextResponse.json(usersWithFollowStatus)
  } catch (error) {
    console.error("Error fetching suggested users:", error)
    return NextResponse.json({ error: "Failed to fetch suggested users" }, { status: 500 })
  }
}