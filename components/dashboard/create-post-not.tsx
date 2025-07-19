import type React from "react"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Image, 
  Smile, 
  Calendar, 
  MapPin, 
  Globe,
  Users,
  Lock,
  ChevronDown,
  X,
  Plus
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreatePostProps {
  onPostCreated?: (post: any) => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [privacy, setPrivacy] = useState("public")
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
          privacy,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create post")
      }

      const newPost = await response.json()

      setContent("")
      setIsExpanded(false)
      setAttachments([])
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

  const handleTextareaFocus = () => {
    setIsExpanded(true)
  }

  const handleCancel = () => {
    setContent("")
    setIsExpanded(false)
    setAttachments([])
  }

  const privacyOptions = [
    { value: "public", icon: Globe, label: "Public", description: "Anyone can see this post" },
    { value: "friends", icon: Users, label: "Friends", description: "Only your friends can see this" },
    { value: "private", icon: Lock, label: "Only me", description: "Only you can see this post" }
  ]

  const currentPrivacy = privacyOptions.find(p => p.value === privacy)
  const remainingChars = 280 - content.length

  return (
    <Card className="border-0 border-b border-gray-200 rounded-none bg-white">
      <h1 className='text-md'>Create Post</h1>
      <CardContent className="p-0">
        <div className="p-4 pb-0">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10 ring-2 ring-gray-100">
              <AvatarImage src={session.user.avatarUrl} alt={session.user.name} />
              <AvatarFallback className="bg-blue-500 text-white font-semibold">
                {session.user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-semibold text-gray-900">{session.user.displayName}</span>
                
              </div>
              
              <div className="p-4 pb-0">
                <Textarea
                  ref={textareaRef}
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onFocus={handleTextareaFocus}
                  className={`border-0 resize-none outline-none focus-visible:ring-0 p-0 bg-transparent placeholder:text-gray-500 `}
                  maxLength={280}
                />
                
                {attachments.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">Image {index + 1}</span>
                        </div>
                        <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black bg-opacity-60 text-white rounded-full p-1 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        
        
        {content.length === 0 && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button
                variant="ghost"
                className="h-12 justify-start space-x-2 text-gray-600 hover:bg-gray-50 border border-gray-200"
                onClick={() => setIsExpanded(true)}
              >
                <Image className="h-5 w-5 text-green-600" />
                <span>Photo/Video</span>
              </Button>
              <Button
                variant="ghost"
                className="h-12 justify-start space-x-2 text-gray-600 hover:bg-gray-50 border border-gray-200"
                onClick={() => setIsExpanded(true)}
              >
                <Smile className="h-5 w-5 text-yellow-500" />
                <span>Feeling/Activity</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}