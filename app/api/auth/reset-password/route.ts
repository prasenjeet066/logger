import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import crypto from "crypto"
import { validatePassword } from "@/lib/security/password-policy"
import { rateLimit } from "@/lib/security/rate-limiter"

export async function POST(request: NextRequest) {
  try {
    const xfwd = request.headers.get('x-forwarded-for') || ''
    const ip = xfwd.split(',')[0]?.trim() || 'unknown'
    await rateLimit('reset-password', ip)

    await connectDB()

    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.errors[0] || 'Weak password' }, { status: 400 })
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

    // Update password and clear reset token
    user.password = password
    user.resetPasswordToken = undefined as any
    user.resetPasswordExpires = undefined as any

    await user.save()

    return NextResponse.json({
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
