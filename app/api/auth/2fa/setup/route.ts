import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import { authenticator } from 'otplib'

function generateTotpSecret(email: string) {
  const secret = authenticator.generateSecret()
  const otpauth = authenticator.keyuri(email, 'logger', secret)
  return { secret, otpauth }
}

export const dynamic = 'force-dynamic'

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

    const { secret, otpauth } = generateTotpSecret(user.email)

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