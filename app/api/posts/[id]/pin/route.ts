import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { connectToDatabase } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    await connectToDatabase()
    
    // Find the user
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    let newPinnedPostId
    
    if (user.pinnedPostId?.toString() === params.id) {
      // If already pinned, unpin it
      newPinnedPostId = null
    } else {
      // Pin new post
      newPinnedPostId = params.id
    }
    
    user.pinnedPostId = newPinnedPostId
    await user.save()
    
    return NextResponse.json({
      success: true,
      pinnedPostId: user.pinnedPostId,
    })
  } catch (error) {
    console.error("Error updating pinnedPostId:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}