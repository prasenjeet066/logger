"use client"

import type React from "react"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ImageIcon, Smile, Calendar, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreatePostProps {
  onPostCreated?: (post: any) => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post",
        variant: "destructive",
      })
      return
    }

    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to post",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create post")
      }

      const newPost = await response.json()

      setContent("")
      onPostCreated?.(newPost)

      toast({
        title: "Success",
        description: "Your post has been created!",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user) {
    return null
  }

  const remainingChars = 280 - content.length

  return (
    <Card className="border-b border-border rounded-none">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
              <AvatarFallback>{session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] text-xl placeholder:text-xl border-none resize-none focus-visible:ring-0 p-0"
                maxLength={280}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button type="button" variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50">
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50">
                    <Calendar className="h-5 w-5" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50">
                    <MapPin className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${remainingChars < 20 ? "text-red-500" : "text-muted-foreground"}`}>
                    {remainingChars}
                  </span>
                  <Button
                    type="submit"
                    disabled={!content.trim() || isSubmitting || remainingChars < 0}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                  >
                    {isSubmitting ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
