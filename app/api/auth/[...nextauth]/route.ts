import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"

// Cast to any to avoid type inference issues with NextAuth generics here
const handler = (NextAuth as any)(authOptions)

export { authOptions as GET, authOptions as POST } from '@/lib/auth/auth-config'
