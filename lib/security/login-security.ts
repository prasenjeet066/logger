// lib/security/login-security.ts
import { User } from "@/lib/mongodb/models/User"
import { connectDB } from "@/lib/mongodb/connection"

interface LoginAttempt {
  email: string
  success: boolean
  ip: string
  userAgent?: string
  timestamp: Date
}

export async function validateLoginAttempt(
  email: string, 
  success: boolean, 
  ip: string,
  userAgent?: string
): Promise<void> {
  try {
    await connectDB()
    
    const attempt: LoginAttempt = {
      email: email.toLowerCase(),
      success,
      ip,
      userAgent,
      timestamp: new Date()
    }
    
    // Log attempt (you might want to use a separate collection for this)
    console.log('Login attempt:', attempt)
    
    if (!success) {
      // Increment failed attempts for user
      const user = await User.findOne({ email: email.toLowerCase() })
      if (user) {
        const failedAttempts = (user.loginAttempts || 0) + 1
        const lockUntil = failedAttempts >= 5 
          ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
          : undefined
        
        await User.findByIdAndUpdate(user._id, {
          loginAttempts: failedAttempts,
          ...(lockUntil && { lockUntil })
        })
      }
    }
  } catch (error) {
    console.error('Error logging login attempt:', error)
  }
}
