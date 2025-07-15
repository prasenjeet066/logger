import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { SettingsContent } from "@/components/settings/settings-content"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/sign-in")
  }

  // Map session.user properties to what SettingsContent expects
  const user = {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    avatar_url: session.user.avatarUrl,
    bio: session.user.bio,
    location: session.user.location,
    website: session.user.website,
    is_verified: session.user.isVerified,
    created_at: session.user.createdAt,
    // Add other properties if SettingsContent expects them
  } as any

  return <SettingsContent user={user} />
}
