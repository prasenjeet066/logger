import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import bcrypt from "bcryptjs"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log('Verify credentials attempt for:', email)

    try {
      await connectDB()
      const user = await User.findOne({ 
        email: email.toLowerCase() 
      }).select('+password +enable2FA +obj2FA +superAccess')
      
      if (!user) {
        console.log('User not found:', email)
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
        console.log('Invalid password for user:', email)
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      console.log('Password valid for user:', email)

      // Update last login attempt
      await User.findByIdAndUpdate(user._id, {
        $set: { 
          lastLoginAt: new Date(),
          lastLoginIP: request.ip || 'unknown'
        },
        $unset: { 
          loginAttempts: 1, 
          lockUntil: 1 
        }
      })

      // Check if 2FA is enabled
      if (user.enable2FA) {
        console.log('2FA required for user:', email)
        return NextResponse.json({ 
          requires2FA: true,
          message: "2FA verification required"
        })
      }

      console.log('Authentication successful for user:', email)
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