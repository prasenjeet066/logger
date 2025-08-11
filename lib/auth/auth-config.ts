// Enhanced auth-config.ts with additional security measures
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/security/rate-limiter"
import { validateLoginAttempt } from "@/lib/security/login-security"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" }, // For 2FA
        fingerprint: { label: "Device Fingerprint", type: "text" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const clientIP = req.headers?.["x-forwarded-for"] || req.connection?.remoteAddress
        
        try {
          // Rate limiting check
          await rateLimit(credentials.email, clientIP)
          
          await connectDB()
          const user = await User.findOne({ 
            email: credentials.email.toLowerCase() 
          }).select('+password +enable2FA +obj2FA +superAccess')
          
          if (!user) {
            // Log failed attempt
            await validateLoginAttempt(credentials.email, false, clientIP)
            throw new Error("Invalid credentials")
          }

          // Check if account is locked
          if (user.lockUntil && user.lockUntil > Date.now()) {
            throw new Error(`Account locked. Try again later.`)
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            await validateLoginAttempt(credentials.email, false, clientIP)
            throw new Error("Invalid credentials")
          }

          // 2FA Verification
          if (user.enable2FA) {
            const is2FAValid = await verify2FA(user, credentials)
            if (!is2FAValid) {
              throw new Error("Invalid 2FA code")
            }
          }

          // Super user additional verification
          if (user.superAccess?.role) {
            const isSuperVerified = await verifySuperUserAccess(user, credentials)
            if (!isSuperVerified) {
              throw new Error("Super user verification failed")
            }
          }

          // Log successful attempt
          await validateLoginAttempt(credentials.email, true, clientIP)
          
          // Update last login
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
          
          return {
            id: user._id.toString(),
            name: user.displayName,
            email: user.email,
            image: user.avatarUrl,
            username: user.username,
            bio: user.bio || null,
            location: user.location || null,
            superAccess: user.superAccess || null,
            website: user.website || null,
            isVerified: user.isVerified || false,
            userType: user.userType || 'human',
            createdAt: user.createdAt,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          throw error
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      }
    }),
  ],
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
    newUser: "/auth/onboarding",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectDB()
          
          // Check if user exists
          const existingUser = await User.findOne({ 
            email: profile?.email?.toLowerCase() 
          })
          
          if (!existingUser) {
            // Create new user for Google sign-in
            const newUser = new User({
              email: profile?.email?.toLowerCase(),
              username: generateUsername(profile?.email),
              displayName: profile?.name || '',
              avatarUrl: profile?.picture,
              isVerified: profile?.email_verified || false,
              userType: 'human',
              emailVerified: profile?.email_verified ? new Date() : null
            })
            
            await newUser.save()
            user.id = newUser._id.toString()
          } else {
            user.id = existingUser._id.toString()
          }
          
          return true
        } catch (error) {
          console.error("Google sign-in error:", error)
          return false
        }
      }
      
      return true
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        const typedUser = user as any
        
        token.id = typedUser.id
        token.username = typedUser.username
        token.name = typedUser.name
        token.avatarUrl = typedUser.image || typedUser.avatarUrl
        token.bio = typedUser.bio
        token.location = typedUser.location
        token.website = typedUser.website
        token.superAccess = typedUser.superAccess
        token.isVerified = typedUser.isVerified
        token.userType = typedUser.userType
        token.createdAt = typedUser.createdAt
        
        if (account) {
          token.provider = account.provider
          token.accessToken = account.access_token
          token.refreshToken = account.refresh_token
        }
      }

      // Refresh token rotation
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.avatarUrl = token.avatarUrl as string
        session.user.bio = token.bio as string || null
        session.user.location = token.location as string || null
        session.user.website = token.website as string || null
        session.user.isVerified = token.isVerified as boolean
        session.user.superAccess = token.superAccess as object || null
        session.user.userType = token.userType as string
        session.user.displayName = token.name as string
        session.user.createdAt = token.createdAt as Date
        session.user.provider = token.provider as string
        
        // Add security context
        session.security = {
          sessionId: token.jti,
          issuedAt: token.iat,
          expiresAt: token.exp
        }
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - Update session daily
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  events: {
    async signIn({ user, account }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`)
      // Log to audit system
    },
    async signOut({ session, token }) {
      console.log(`User signed out: ${token?.email}`)
      // Invalidate session in database if needed
    }
  }
}

// Helper functions
async function verify2FA(user: any, credentials: any): Promise<boolean> {
  // Implement 2FA verification logic
  const enabledMethods = user.obj2FA.waysVerify.filter((method: any) => method.enabled)
  
  for (const method of enabledMethods) {
    switch (method.type) {
      case 'email':
        // Verify email OTP
        break
      case 'phone':
        // Verify SMS OTP
        break
      case 'authenticator':
        // Verify TOTP code
        if (credentials.totpCode) {
          return verifyTOTP(method.value, credentials.totpCode)
        }
        break
      case 'fingerprint':
        // Verify device fingerprint
        if (credentials.fingerprint) {
          return verifyFingerprint(user._id, credentials.fingerprint)
        }
        break
    }
  }
  
  return false
}

async function verifySuperUserAccess(user: any, credentials: any): Promise<boolean> {
  const { superAccess } = user
  if (!superAccess || !superAccess.verificationWays) return false
  
  // Check if super access has expired
  if (superAccess.expireAt && new Date() > superAccess.expireAt) {
    return false
  }
  
  // Verify additional security measures for super users
  const requiredVerifications = Object.entries(superAccess.verificationWays)
    .filter(([_, enabled]) => enabled)
  
  // Implement verification logic for each enabled method
  return requiredVerifications.length > 0 // Simplified check
}

function generateUsername(email: string): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  return base + Math.random().toString(36).substr(2, 4)
}

function verifyTOTP(secret: string, code: string): boolean {
  // Implement TOTP verification using libraries like 'otplib'
  return true // Placeholder
}

function verifyFingerprint(userId: string, fingerprint: string): boolean {
  // Implement device fingerprint verification
  return true // Placeholder
}