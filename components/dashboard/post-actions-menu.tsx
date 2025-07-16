"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2, Pin, Flag, Ban, UserX } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Post } from "@/types/post"

interface PostActionsMenuProps {
  post: Post
  currentUserId: string
  onPostUpdated?: () => void
  onPostDeleted?: () => void
  onPinPost?: () => void
}

export function PostActionsMenu({
  post,
  currentUserId,
  onPostUpdated,
  onPostDeleted,
  onPinPost,
}: PostActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()

  const isAuthor = post.authorId === currentUserId

  const handleDeletePost = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete post")
      }

      onPostDeleted?.()
      setShowDeleteDialog(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handlePinToggle = async () => {
    if (onPinPost) {
      onPinPost()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isAuthor && (
          <>
            <DropdownMenuItem onClick={handlePinToggle}>
              <Pin className="mr-2 h-4 w-4" />
              {post.isPinned ? "Unpin Post" : "Pin Post"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Post
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your post and remove its data from our
                    servers.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeletePost}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
        {!isAuthor && (
          <>
            <DropdownMenuItem>
              <Flag className="mr-2 h-4 w-4" />
              Report Post
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Ban className="mr-2 h-4 w-4" />
              Block User
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UserX className="mr-2 h-4 w-4" />
              Mute User
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
