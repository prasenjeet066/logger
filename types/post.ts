export interface Post {
  _id: string
  content: string
  authorId: string
  mediaUrls?: string[]
  mediaType?: "image" | "video" | "gif"
  likesCount: number
  repostsCount: number
  repliesCount: number
  isRepost: boolean
  originalPostId?: string // Renamed from replyToId for consistency with MongoDB model
  parentPostId?: string // For replies
  hashtags: string[]
  mentions: string[]
  isPinned: boolean
  createdAt: string // Date string
  updatedAt: string // Date string
  author: {
    // Populated author data
    id: string
    username: string
    displayName: string
    avatarUrl?: string
    isVerified: boolean
  }
  isLiked: boolean // Client-side only
  isReposted: boolean // Client-side only
  repostedBy?: string // Client-side only, for display (username of the reposting user)
}
