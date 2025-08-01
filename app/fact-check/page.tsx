"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PostCard } from "@/components/dashboard/post-card"
import Link from "next/link"
import { Spinner } from "@/components/loader/spinner"
import { PostSection } from "@/components/post/post-section"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Paperclip } from "lucide-react"
import Image from "next/image"

type Props = {
  searchParams: {
    post ? : string
  }
}

export default function FactCheck({ searchParams }: Props) {
  const router = useRouter()
  const postId = searchParams.post || null;
  const [Post, SetPost] = useState < any > (null)
  
  const fetch_post = async () => {
    try {
      const _post = await fetch('/api/posts/' + postId ,{method:"GET"})
      if (_post.ok) {
        const post = await _post.json();
        SetPost(post)
      }
    } catch (e) {
      router.back()
    }
  }
  
  useEffect(() => {
    if (!postId) {
      router.back()
    } else {
      fetch_post()
    }
  }, [postId])
  
  const handleRepost = () => {}
  const handleLike = () => {}
  
  const reviewResults = Post ? JSON.parse(Post.reviewResults.content) : null
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto border-x min-h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 z-50 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold">Fact Check</h1>
            <span className="text-sm text-gray-500">{postId}</span>
          </div>
        </div>

        {reviewResults && (
          <div className='flex flex-col gap-2 p-4'>
            <span className='font-semibold border-b'>
              {reviewResults.oneLineAboutThisText}
            </span>
            <p className='text-xs w-full'>
              {reviewResults.factCheck}
            </p>
          </div>
        )}

        {Post && (
  <div style={{ pointerEvents: "none" }} className='p-2 border rounded-md'>
    <PostCard
      key={Post._id}
      post={Post}
      onLike={handleLike}
      onRepost={handleRepost}
    />
  </div>
)}
      </div>
    </div>
  )
}