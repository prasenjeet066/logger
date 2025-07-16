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
    displayName: session.user.displayName, // Ensure displayName is passed
    avatarUrl: session.user.avatarUrl,
    coverUrl: session.user.coverUrl, // Ensure coverUrl is passed
    bio: session.user.bio,
    location: session.user.location,
    website: session.user.website,
    isVerified: session.user.isVerified,
    createdAt: session.user.createdAt,
    isPrivate: session.user.isPrivate,
    allowMessages: session.user.allowMessages,
    showEmail: session.user.showEmail,
    emailNotifications: session.user.emailNotifications,
    pushNotifications: session.user.pushNotifications,
    soundEnabled: session.user.soundEnabled,
    darkMode: session.user.darkMode,
    language: session.user.language,
  } as any // Cast to any for now, but ideally define a proper type for initialUser

  return <SettingsContent initialUser={user} />
}
