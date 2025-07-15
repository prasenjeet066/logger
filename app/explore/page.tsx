import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { ExploreContent } from "@/components/explore/explore-content"

export default async function ExplorePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/sign-in")
  }

  return <ExploreContent />
}
