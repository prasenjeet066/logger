import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { SettingsContent } from "@/components/settings/settings.tsx"

export default async function SettingsPage({searchParams}) {
  const session = await getServerSession(authOptions)
  const t = searchParams.t || null;
  
  
  if (!session?.user) {
    redirect("/auth/sign-in")
  }

  // Map session.user properties to what SettingsContent expects
  const user = {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    displayName: session.user.name,
    avatarUrl: session.user.image,
    bio: session.user.bio,
    location: session.user.location,
    website: session.user.website,
    isVerified: session.user.isVerified,
    createdAt: session.user.createdAt,
  }

  return <SettingsContent user={user} t = {t}/>
}
