// app/posts/[id]/page.tsx (Next.js App Router)

import { PostDetailContent } from "@/components/post/post-detail-content"
import { connectDB } from "@/lib/mongodb/connection"
import { Post } from "@/lib/mongodb/models/Post"

// ✅ Revalidate page every 60 seconds
export const revalidate = 60

interface PostPageProps {
  params: { id: string }
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = params
  
  // Get post data at build time or revalidation
  await connectDB()
  const post = await Post.findById(id).lean()
  
  if (!post) {
    return <div>Post not found</div>
  }
  
  // Render the post; user session will be fetched client-side
  return <PostDetailContent postId={id} />
}

// Optional: Pre-generate some popular posts at build time
export async function generateStaticParams() {
  await connectDB()
  const posts = await Post.find().select("_id").limit(10).lean()
  
  return posts.map(post => ({
    id: post._id.toString(),
  }))
}