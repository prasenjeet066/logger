import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config" // Assuming authOptions is exported from here
import { ProfileContent } from "@/components/profile/profile-content"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions)

  // Allow viewing profiles even when not logged in
  // currentUserId will be the MongoDB _id from the session user
  const currentUserId = session?.user?.id || null

  return <ProfileContent username={params.username} currentUserId={currentUserId} />
}
