declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      username: string
      image?: string
      avatarUrl?: string
      displayName?: string
      bio?: string | null
      location?: string | null
      website?: string | null
      isVerified?: boolean
      userType?: string
      provider?: string
      createdAt?: Date
    }
    security?: {
      sessionId?: string
      issuedAt?: number
      expiresAt?: number
    }
  }

  interface User {
    id: string
    email: string
    name: string
    username: string
    image?: string
    avatarUrl?: string
    displayName?: string
    bio?: string | null
    location?: string | null
    website?: string | null
    isVerified?: boolean
    userType?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string
    id?: string
    name?: string
    avatarUrl?: string
    bio?: string | null
    location?: string | null
    website?: string | null
    isVerified?: boolean
    userType?: string
    createdAt?: Date
    provider?: string
    accessToken?: string
    refreshToken?: string
    superAccess?: any
  }
}
