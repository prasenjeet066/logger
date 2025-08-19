import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { getTimelinePosts, getUserInteractions } from "@/lib/timeline/timeline-service"
import { TimelineClient } from "@/components/dashboard/timeline-client"
import { redirect } from "next/navigation"

interface TimelinePageProps {
  searchParams: {
    algorithm?: string
    page?: string
  }
}

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }
  
  const algorithm = searchParams.algorithm || 'algorithmic'
  const page = parseInt(searchParams.page || '1', 10)
  const limit = 20
  
  // Get cached timeline posts
  const posts = await getTimelinePosts(session.user.id, algorithm, limit)
  
  // Get fresh user interaction data
  const postIds = posts.map(p => p._id)
  const userInteractions = await getUserInteractions(session.user.id, postIds)
  
  // Hydrate posts with user-specific data
  const hydratedPosts = posts.map(post => ({
    ...post,
    isLiked: userInteractions.likedPostIds.has(post._id),
    isReposted: userInteractions.repostedOriginalPostIds.has(post._id)
  }))
  
  return (
    <TimelineClient 
      initialPosts={hydratedPosts}
      algorithm={algorithm}
      userId={session.user.id}
      page={page}
    />
  )
}