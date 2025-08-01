import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { PostCard } from "./post-card"
import Link from "next/link"
import { Spinner } from "@/components/loader/spinner"
import { PostSection } from "@/components/post/post-section"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Paperclip } from "lucide-react"
import Image from "next/image"


export default function FactCheck({ searchParams }) {
  const router = useRouter()
  const postId = searchParams.post || null;
  const [Post, SetPost] = useState(null)
  const fetch_post = async () => {
    try {
      const _post = await fetch('/api/posts/' + postId)
      if (_post.ok) {
        const post = await _post.json();
        SetPost(post)
      }
    } catch (e) {
      router.back()
    }
  }
  useEffect(() => {
    fetch_post()
  }, [postId])
  if (postId === null) {
    router.back()
  }
  const handleRepost = () => {}
  const handleLike = () => {}
  const reviewResults = JSON.parse(Post.content)
  return (
    <>
      <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto border-x min-h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 z-50 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold">Fact Check</h1>
            <span className="text-sm text-gray-500">
              {postId}
            </span>
          </div>
        </div>
        <div className = 'flex flex-col gap-2'>
          <span className='font-semibold border-b'>
            {reviewResults.oneLineAboutThisText}
          </span>
          <p className='text-xs w-full'>
            {reviewResults.factCheck}
          </p>
          
        </div>
        <div className = ''>
          <PostCard key = { Post._id }
post = { Post }
onLike = { handleLike }
onRepost = { handleRepost }/>
          
        </div>
        </div>
        </div>
    </>
  )
}