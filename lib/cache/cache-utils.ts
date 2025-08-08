// lib/cache/cache-utils.ts - Cache invalidation utilities
import { revalidateTag, revalidatePath } from 'next/cache'

export const invalidateTimeline = () => {
  revalidateTag('timeline')
  revalidatePath('/dashboard/timeline')
}

export const invalidateTrending = () => {
  revalidateTag('trending')
}

export const invalidateUserInteractions = (userId: string) => {
  revalidateTag(`user-interactions-${userId}`)
}

// Webhook or background job to invalidate cache when new posts are created
export const handleNewPost = async (postData: any) => {
  // Invalidate relevant caches
  invalidateTimeline()
  if (shouldInvalidateTrending(postData)) {
    invalidateTrending()
  }
}

const shouldInvalidateTrending = (post: any) => {
  // Logic to determine if a post might affect trending
  return post.likesCount + post.repostsCount + post.repliesCount > 5
}