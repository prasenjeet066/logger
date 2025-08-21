import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"

// Placeholder: In production, use a TOTP lib like otplib to generate secrets/URIs
function generateTotpSecret() {
  const secret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const otpauth = `otpauth://totp/logger:${Date.now()}?secret=${secret}&issuer=logger`
  return { secret, otpauth }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: (session.user as any).email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { secret, otpauth } = generateTotpSecret()

    // Save 2FA method scaffold; actual secret storage should be encrypted
    user.enable2FA = true
    user.obj2FA = {
      waysVerify: [
        { type: 'authenticator', value: secret, enabled: true },
      ]
    }
    await user.save()

    return NextResponse.json({ secret, otpauth })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 })
  }
}