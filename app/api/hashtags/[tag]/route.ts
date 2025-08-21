import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"
import { User } from "@/lib/mongodb/models/User"
import { Like } from "@/lib/mongodb/models/Like"

export async function GET(request: NextRequest, { params }: { params: { tag: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tag = decodeURIComponent(params.tag || '').toLowerCase()
    if (!tag) return NextResponse.json([], { status: 200 })

    await connectDB()

    const currentUser = await User.findOne({ email: (session.user as any).email }).lean()
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const posts = await Post.find({ hashtags: tag })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const authorIds = [...new Set(posts.map(p => p.authorId))]
    const authors = await User.find({ _id: { $in: authorIds } }).select('_id username displayName avatarUrl isVerified').lean()
    const authorMap = new Map(authors.map(a => [a._id.toString(), a]))

    const postIds = posts.map(p => p._id.toString())
    const likes = await Like.find({ userId: currentUser._id.toString(), postId: { $in: postIds } }).select('postId').lean()
    const likedSet = new Set(likes.map(l => l.postId.toString()))

    const result = posts.map(post => ({
      _id: post._id.toString(),
      content: post.content,
      createdAt: post.createdAt,
      authorId: post.authorId,
      author: authorMap.get(post.authorId) ? {
        id: authorMap.get(post.authorId)!._id.toString(),
        username: authorMap.get(post.authorId)!.username,
        displayName: authorMap.get(post.authorId)!.displayName,
        avatarUrl: authorMap.get(post.authorId)!.avatarUrl,
        isVerified: authorMap.get(post.authorId)!.isVerified,
      } : null,
      likesCount: post.likesCount,
      repostsCount: post.repostsCount,
      repliesCount: post.repliesCount,
      isLiked: likedSet.has(post._id.toString()),
      isReposted: false,
      mediaUrls: post.mediaUrls || [],
      mediaType: post.mediaType || null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching hashtag posts:', error)
    return NextResponse.json({ error: 'Failed to fetch hashtag posts' }, { status: 500 })
  }
}