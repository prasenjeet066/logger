import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { NotificationsContent } from "@/components/notifications/notifications-content"

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/sign-in")
  }

  return <NotificationsContent />
}
