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
        await connectDB()
        
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await User.findOne({ email: credentials.email })
        if (!user) return null
        
        const passwordMatches = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatches) return null
        
        const verifyWays = user.getEnabledVerificationWays?.() || []
        
        return {
          id: user._id.toString(),
          name: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          username: user.username,
          bio: user.bio,
          location: user.location,
          website: user.website,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          needMoreVerify: verifyWays.length > 0,
          verifyWays
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.avatarUrl = (user as any).avatarUrl
        token.bio = (user as any).bio
        token.location = (user as any).location
        token.website = (user as any).website
        token.isVerified = (user as any).isVerified
        token.createdAt = (user as any).createdAt
        token.needMoreVerify = (user as any).needMoreVerify
        token.verifyWays = (user as any).verifyWays
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user= {
          id: token.id as string,
          username: token.username as string,
          avatarUrl: token.avatarUrl as string,
          bio: token.bio as string,
          location: token.location as string,
          website: token.website as string,
          isVerified: token.isVerified as boolean,
          createdAt: token.createdAt as Date,
          needMoreVerify: token.needMoreVerify as boolean,
          verifyWays: token.verifyWays as any
        }
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}