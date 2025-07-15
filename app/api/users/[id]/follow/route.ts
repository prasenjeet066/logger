import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Follow } from "@/lib/mongodb/models/Follow"
import { User } from "@/lib/mongodb/models/User"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const follower = await User.findOne({ email: session.user.email })
    const following = await User.findById(params.id)

    if (!follower || !following) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const followerId = follower._id.toString()
    const followingId = following._id.toString()

    // Check if already following
    const existingFollow = await Follow.findOne({ followerId, followingId })

    if (existingFollow) {
      // Unfollow
      await Follow.deleteOne({ followerId, followingId })
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } })
      await User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } })

      return NextResponse.json({ following: false })
    } else {
      // Follow
      await Follow.create({ followerId, followingId })
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } })
      await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } })

      return NextResponse.json({ following: true })
    }
  } catch (error) {
    console.error("Error toggling follow:", error)
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 })
  }
}
