import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { ExploreContent } from "@/components/explore/explore-content"
//import { useSearchParams } from 'next/navigation'

export default async function ExplorePage({ searchParams }) {
  const session = await getServerSession(authOptions)
  
  const q = searchParams.q || null;

  // Allow public access to explore page
  // if (!session?.user) {
  //   redirect("/auth/sign-in")
  // }
  
  return <ExploreContent params={q} />
}