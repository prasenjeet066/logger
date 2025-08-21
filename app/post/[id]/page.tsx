// app/posts/[id]/page.tsx (Next.js App Router)

import { PostDetailContent } from "@/components/post/post-detail-content"

export const dynamic = "force-dynamic"

interface PostPageProps {
  params: { id: string }
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = params
  return <PostDetailContent postId={id} />
}