import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: "If an account with that email exists, we have sent a password reset link.",
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    // Set reset token and expiration (10 minutes)
    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000)

    await user.save()

    // In a real application, you would send an email here
    // For now, we'll just return the token (remove this in production)
    console.log("Reset token for", email, ":", resetToken)

    return NextResponse.json({
      message: "If an account with that email exists, we have sent a password reset link.",
      // Remove this in production:
      resetToken: resetToken,
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
