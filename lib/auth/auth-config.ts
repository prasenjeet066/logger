import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { connectDB } from "@/lib/mongodb/connection"
import User from "@/lib/mongodb/models/User"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }
        
        try {
          await connectDB()
          const user = await User.findOne({ email: credentials.email.toLowerCase() })
          
          if (!user) {
            throw new Error("No user found with this email")
          }
          
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            throw new Error("Invalid password")
          }
          
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
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/sign-in",
    newUser: "/auth/new-user", // Add this if you have a new user onboarding page
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Type assertion for user properties
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
        token.createdAt = typedUser.createdAt
        
        // Add provider information
        if (account) {
          token.provider = account.provider
        }
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
        session.user.displayName = token.name as string
        session.user.createdAt = token.createdAt as Date
        session.user.provider = token.provider as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}