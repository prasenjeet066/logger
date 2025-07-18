"use client"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { useMobile } from "@/hooks/use-mobile"
import { authOptions } from "@/lib/auth/auth-config"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { WebDashboardContent } from "@/components/dashboard/web/dashboard-content"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const isMobile = useMobile()
  if (!session?.user) {
    redirect("/auth/sign-in")
  }
  
  // Map session.user properties to what DashboardContent expects
  const user = {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    avatar_url: session.user.avatarUrl,
    // Add other properties if DashboardContent expects them
  }
  
  
  if (isMobile) {
    return <DashboardContent user={user} />
  } else if (!isMobile) {
    return <WebDashboardContent user={user} />
  }
  
}