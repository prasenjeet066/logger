import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { PostDetailContent } from "@/components/post/post-detail-content"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params

  // Get session using NextAuth
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/sign-in")
  }

  // Connect to MongoDB and get user data
  let currentUser = null
  try {
    await connectDB()

    // Find user by email from session
    currentUser = await User.findOne({ email: session.user.email }).lean()

    if (!currentUser) {
      // If user not found in database, redirect to sign-in
      redirect("/auth/sign-in")
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    redirect("/auth/sign-in")
  }

  return <PostDetailContent postId={id} userId={currentUser._id.toString()} />
}
