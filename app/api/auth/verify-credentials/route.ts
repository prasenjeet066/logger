import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/security/rate-limiter"
import { validateLoginAttempt } from "@/lib/security/login-security"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const xfwd = request.headers.get("x-forwarded-for") as string | undefined
    const clientIP = (xfwd?.split(",")[0]?.trim()) || request.ip || "unknown"
    
    try {
      // Rate limiting check
      await rateLimit(email, clientIP)
      
      await connectDB()
      const user = await User.findOne({ 
        email: email.toLowerCase() 
      }).select('+password +enable2FA +obj2FA +superAccess')
      
      if (!user) {
        // Log failed attempt
        await validateLoginAttempt(email, false, clientIP)
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > Date.now()) {
        return NextResponse.json({ 
          error: `Account locked. Try again later.`,
          lockUntil: user.lockUntil
        }, { status: 423 })
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      
      if (!isPasswordValid) {
        await validateLoginAttempt(email, false, clientIP)
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      // Log successful attempt
      await validateLoginAttempt(email, true, clientIP)
      
      // Update last login attempt
      await User.findByIdAndUpdate(user._id, {
        $set: { 
          lastLoginAt: new Date(),
          lastLoginIP: clientIP 
        },
        $unset: { 
          loginAttempts: 1, 
          lockUntil: 1 
        }
      })

      // Check if 2FA is enabled
      if (user.enable2FA) {
        return NextResponse.json({ 
          requires2FA: true,
          message: "2FA verification required"
        })
      }

      // If no 2FA, return success
      return NextResponse.json({ 
        requires2FA: false,
        message: "Authentication successful"
      })

    } catch (error) {
      console.error("Authentication error:", error)
      return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Request parsing error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}