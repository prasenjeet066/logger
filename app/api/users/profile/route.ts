import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const {
      password,               // exclude sensitive fields
      resetPasswordToken,
      resetPasswordExpires,
      ...config
    } = body

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { ...config },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    // Remove sensitive information before sending response
    const updatedUserObj = updatedUser.toObject()
    const {
      password: _password,
      resetPasswordToken: _resetPasswordToken,
      resetPasswordExpires: _resetPasswordExpires,
      ...userResponse
    } = updatedUserObj

    return NextResponse.json(userResponse)
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}