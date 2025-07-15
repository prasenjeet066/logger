import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Hash the token to match what's stored in the database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    return NextResponse.json({
      message: "Token is valid",
    })
  } catch (error) {
    console.error("Verify reset token error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
