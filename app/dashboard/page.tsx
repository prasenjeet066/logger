import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { DashboardWrapper } from "./client-wrapper"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/sign-in")
  }
  
  // Map session.user properties to what DashboardContent expects
  const user = {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    avatarUrl: session.user.avatarUrl,
  }
  
  return <DashboardWrapper user={user} />
}