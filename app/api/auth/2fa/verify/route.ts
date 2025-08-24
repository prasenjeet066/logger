import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import { authenticator } from 'otplib'

function verifyTotp(secret: string, code: string): boolean {
  try {
    return authenticator.verify({ token: code, secret: secret })
  } catch (error) {
    console.error('TOTP verification error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code } = await request.json()
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: (session.user as any).email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const method = user.obj2FA?.waysVerify?.find((w: any) => w.type === 'authenticator' && w.enabled)
    if (!method?.value) {
      return NextResponse.json({ error: '2FA not set up' }, { status: 400 })
    }

    const ok = verifyTotp(method.value, code)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    return NextResponse.json({ verified: true })
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 })
  }
}