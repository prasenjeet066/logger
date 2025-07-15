"use client"

import type React from "react"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface Post {
  _id: string
  content: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
    isVerified: boolean
  }
  createdAt: string
}

interface ReplyDialogProps {
  post: Post
  open: boolean
  onOpenChange: (open: boolean) => void
  onReplyCreated?: (reply: any) => void
}

export function ReplyDialog({ post, open, onOpenChange, onReplyCreated }: ReplyDialogProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply",
        variant: "destructive",
      })
      return
    }

    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to reply",
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
          replyToId: post._id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create reply")
      }

      const newReply = await response.json()

      setContent("")
      onOpenChange(false)
      onReplyCreated?.(newReply)

      toast({
        title: "Success",
        description: "Your reply has been posted!",
      })
    } catch (error) {
      console.error("Error creating reply:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create reply",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const remainingChars = 280 - content.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Reply to {post.author.displayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original post */}
          <div className="flex space-x-3 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author.avatarUrl || ""} alt={post.author.displayName} />
              <AvatarFallback>{post.author.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{post.author.displayName}</span>
                <span className="text-muted-foreground text-sm">@{post.author.username}</span>
              </div>
              <p className="text-sm mt-1">{post.content}</p>
            </div>
          </div>

          {/* Reply form */}
          <form onSubmit={handleSubmit}>
            <div className="flex space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder={`Reply to @${post.author.username}...`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={280}
                />

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${remainingChars < 20 ? "text-red-500" : "text-muted-foreground"}`}>
                    {remainingChars}
                  </span>
                  <Button
                    type="submit"
                    disabled={!content.trim() || isSubmitting || remainingChars < 0}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {isSubmitting ? "Replying..." : "Reply"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
