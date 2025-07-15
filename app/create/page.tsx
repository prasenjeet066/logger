import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import CreatePostPage from "@/components/create/create-post-page"

export default async function CreatePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/sign-in")
  }

  // Map session.user properties to what CreatePostPage expects
  const user = {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    avatar_url: session.user.avatarUrl,
    // Add other properties if CreatePostPage expects them
  } as any

  return <CreatePostPage user={user} />
}
