import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import connectDB from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()

        const user = await User.findOne({ email: credentials.email })
        if (!user) {
          return null
        }

        // For demo purposes, we'll skip password verification
        // In production, you'd verify the hashed password

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.displayName,
          username: user.username,
          image: user.avatarUrl,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.username = token.username as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        await connectDB()

        const existingUser = await User.findOne({ email: user.email })
        if (!existingUser) {
          const username = user.email?.split("@")[0] || "user"
          await User.create({
            email: user.email,
            username,
            displayName: user.name,
            avatarUrl: user.image,
          })
        }
      }
      return true
    },
  },
  pages: {
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
  },
  session: {
    strategy: "jwt",
  },
}
