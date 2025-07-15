declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      username: string
      image?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    username: string
    image?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string
  }
}
