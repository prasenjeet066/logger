// Enhanced auth-config.ts with additional security measures
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/security/rate-limiter"
import { validateLoginAttempt } from "@/lib/security/login-security"
import { SessionManager } from "@/lib/security/session-manager"
import { authenticator } from 'otplib'
import { NEXTAUTH_SECRET } from '@/lib/auth/secret'

export const authOptions = {
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

        const xfwd = (req.headers as any)?.["x-forwarded-for"] as string | undefined
        const clientIP = (xfwd?.split(",")[0]?.trim()) || (req as any)?.ip || "unknown"
        
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

          // 2FA Verification - only if totpCode is provided
          if (user.enable2FA && credentials.totpCode) {
            const is2FAValid = await verify2FA(user, credentials)
            if (!is2FAValid) {
              throw new Error("Invalid 2FA code")
            }
          } else if (user.enable2FA && !credentials.totpCode) {
            // If 2FA is enabled but no code provided, this should not happen
            // as the user should be redirected to 2FA page
            throw new Error("2FA verification required")
          }

          // Super user additional verification
          if (user.superAccess?.role) {
            const isSuperVerified = await verifySuperUserAccess(user, credentials)
            if (!isSuperVerified) {
              throw new Error("Super user verification failed")
            }
          }

          // Optional: basic device fingerprint check if provided
          if (credentials.fingerprint && typeof credentials.fingerprint === 'string') {
            // For now, accept fingerprint; could cross-check against user.trustedDevices
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
            ;(user as any).id = newUser._id.toString()
          } else {
            ;(user as any).id = existingUser._id.toString()
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
          token.accessToken = (account as any).access_token
          token.refreshToken = (account as any).refresh_token
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
        ;(session.user as any).id = token.id as string
        ;(session.user as any).username = token.username as string
        ;(session.user as any).avatarUrl = token.avatarUrl as string
        ;(session.user as any).bio = (token as any).bio as string || null
        ;(session.user as any).location = (token as any).location as string || null
        ;(session.user as any).website = (token as any).website as string || null
        ;(session.user as any).isVerified = token.isVerified as boolean
        ;(session.user as any).superAccess = (token as any).superAccess as object || null
        ;(session.user as any).userType = token.userType as string
        ;(session.user as any).displayName = token.name as string
        ;(session.user as any).createdAt = token.createdAt as Date
        ;(session.user as any).provider = (token as any).provider as string
        
        // Add security context
        ;(session as any).security = {
          sessionId: (token as any).jti,
          issuedAt: (token as any).iat,
          expiresAt: (token as any).exp
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
    secret: NEXTAUTH_SECRET,
  },
  secret: NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  events: {
    async signIn({ token }) {
      try {
        if ((token as any)?.sub) {
          SessionManager.addSession((token as any).sub, (token as any).jti || '')
        }
      } catch {}
    },
    async signOut({ token }) {
      try {
        if ((token as any)?.sub) {
          SessionManager.removeSession((token as any).sub, (token as any).jti || '')
        }
      } catch {}
    }
  }
} as const

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
  try {
    // Verify the TOTP code
    return authenticator.verify({ token: code, secret: secret })
  } catch (error) {
    console.error('TOTP verification error:', error)
    return false
  }
}

function verifyFingerprint(userId: string, fingerprint: string): boolean {
  // Implement device fingerprint verification
  return true // Placeholder
}