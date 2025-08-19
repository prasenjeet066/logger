import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { DashboardWrapper } from "./dashboard/client-wrapper"
import { LandingPage } from "@/components/landing-page"

export default async function HomePage() {
  // Check if user is logged in
  const session = await getServerSession(authOptions)
  
  // If user is logged in, show the dashboard
  if (session?.user) {
    const user = {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      avatarUrl: session.user.avatarUrl,
    }
    return <DashboardWrapper user={user} />
  }

  // If user is not logged in, show the landing page
  return <LandingPage />
}