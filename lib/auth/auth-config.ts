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
        const user = await User.findOne({ email: credentials?.email })

        if (user && (await bcrypt.compare(credentials?.password || "", user.password))) {
          return {
            id: user._id.toString(),
            name: user.displayName,
            email: user.email,
            image: user.avatarUrl,
            username: user.username,
            
            bio: user.bio,
            location: user.location,
            superAccess : user.superAccess || null,
            website: user.website,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
          }
        }
        return null
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/sign-in", // Error page for authentication errors
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.name =(user as any).name
        token.avatarUrl = (user as any).avatarUrl
        token.bio = (user as any).bio
        token.location = (user as any).location
        token.website = (user as any).website
        token.superAccess = (user as any).superAccess
        token.isVerified = (user as any).isVerified
        token.createdAt = (user as any).createdAt
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.avatarUrl = token.avatarUrl as string
        session.user.bio = token.bio as string
        session.user.location = token.location as string
        session.user.website = token.website as string
        session.user.isVerified = token.isVerified as boolean
        session.user.superAccess = token.superAccess as object
        session.user.displayName = token.name as string
        session.user.createdAt = token.createdAt as Date
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
