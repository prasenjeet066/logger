import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import { Follow } from "@/lib/mongodb/models/Follow"

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    await connectDB()

    const session = await getServerSession(authOptions)
    let currentUserId: string | null = null
    if (session?.user?.email) {
      const currentUser = await User.findOne({ email: session.user.email }).select("_id").lean()
      currentUserId = currentUser?._id.toString() || null
    }

    const user = await User.findOne({ username: params.username }).lean()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let isFollowing = false
    if (currentUserId) {
      const follow = await Follow.findOne({ followerId: currentUserId, followingId: user._id.toString() })
      isFollowing = !!follow
    }

    // Remove sensitive information from user profile
    const { password, resetPasswordToken, resetPasswordExpires, ...userResponse } = user

    return NextResponse.json({
      user: {
        ...userResponse,
        _id: userResponse._id.toString(),
        isFollowing, // Add isFollowing status
      },
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
