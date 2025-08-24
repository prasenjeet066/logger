import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import { Post } from "@/lib/mongodb/models/Post"
import { Follow } from "@/lib/mongodb/models/Follow" // Import Follow model
import { Like } from "@/lib/mongodb/models/Like" // Import Like model

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    await connectDB()

    const session = await getServerSession(authOptions)
    console.log('Profile API - Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: (session?.user as any)?.id,
      username: (session?.user as any)?.username,
      requestedUsername: params.username
    });
    
    let currentUserId: string | null = null
    if (session?.user?.email) {
      const currentUser = await User.findOne({ email: session.user.email }).select("_id").lean()
      currentUserId = currentUser?._id.toString() || null
      console.log('Profile API - Current user:', {
        found: !!currentUser,
        currentUserId,
        requestedUsername: params.username,
        isOwnProfile: currentUserId && params.username === (session?.user as any)?.username
      });
    }

    const user = await User.findOne({ username: params.username }).lean()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const posts = await Post.find({ authorId: user._id.toString() }).sort({ createdAt: -1 }).limit(20).lean()

    let isFollowing = false
    if (currentUserId) {
      const follow = await Follow.findOne({ followerId: currentUserId, followingId: user._id.toString() })
      isFollowing = !!follow
    }

    // Get liked status for current user for all fetched posts
    const postIds = posts.map((p) => p._id.toString())
    let likedPostIds = new Set<string>()
    if (currentUserId) {
      const likedPosts = await Like.find({
        userId: currentUserId,
        postId: { $in: postIds },
      })
        .select("postId")
        .lean()
      likedPostIds = new Set(likedPosts.map((like) => like.postId.toString()))
    }

    // Get reposted status for current user for all fetched posts
    let repostedOriginalPostIds = new Set<string>()
    if (currentUserId) {
      const repostedPosts = await Post.find({
        authorId: currentUserId,
        isRepost: true,
        originalPostId: { $in: postIds },
      })
        .select("originalPostId")
        .lean()
      repostedOriginalPostIds = new Set(repostedPosts.map((repost) => repost.originalPostId?.toString()))
    }

    const formattedPosts = posts.map((post) => ({
      ...post,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: {
        // Populate author for consistency, even if it's the profile owner
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
      isLiked: likedPostIds.has(post._id.toString()),
      isReposted: repostedOriginalPostIds.has(post._id.toString()),
    }))

    // Remove sensitive information from user profile
    const { password, resetPasswordToken, resetPasswordExpires, ...userResponse } = user

    return NextResponse.json({
      user: {
        ...userResponse,
        _id: userResponse._id.toString(),
        isFollowing, // Add isFollowing status
      },
      posts: formattedPosts,
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
