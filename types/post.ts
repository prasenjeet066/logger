export interface Post {
  _id: string
  content: string
  authorId: string
  createdAt: string
  updatedAt: string
  likesCount: number
  repliesCount: number
  repostsCount: number
  viewsCount: number
  watch?: number
  mediaUrls?: string[]
  mediaType?: "image" | "video" | "gif"
  isRepost: boolean
  originalPostId?: string
  parentPostId?: string
  hashtags: string[]
  mentions: string[]
  isPinned: boolean
  reviewResults?: any
  visibility?: "public" | "private" | "f-private"
  restrictions?: any
  imageNSFW?: any
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
    isVerified: boolean
  }
  isLiked: boolean
  isReposted: boolean
  repostedBy?: string
}
