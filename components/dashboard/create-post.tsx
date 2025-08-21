import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ImageIcon, 
  Smile, 
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  Globe,
  Users,
  Lock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/upload/file-upload"
import type { UploadResult } from "@/lib/blob/client"
import { useTextHighlighter } from "@/components/dashboard/utils/text-highlighter"

const MAX_CHARACTERS = 280
const MAX_MEDIA_FILES = 4

interface CreatePostProps {
  onPostCreated?: (post: any) => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const { highlight, extract } = useTextHighlighter()
  
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [privacy, setPrivacy] = useState("public")
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([])
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [isEnhancingText, setIsEnhancingText] = useState(false)
  const [error, setError] = useState("")
  const contentEditableRef = useRef<HTMLDivElement>(null)
  const cursorPositionRef = useRef<{ offset: number } | null>(null)

  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionResults, setMentionResults] = useState<Array<{ _id: string; username: string; displayName: string; avatarUrl?: string }>>([])
  const [showMentionList, setShowMentionList] = useState(false)

  const characterCount = content.length
  const isOverLimit = characterCount > MAX_CHARACTERS
  const remainingChars = MAX_CHARACTERS - characterCount

  // Utility functions for contentEditable
  const getCaretCharacterOffset = useCallback((element: HTMLElement) => {
    let caretOffset = 0
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(element)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      caretOffset = preCaretRange.toString().length
    }
    return caretOffset
  }, [])

  const setCaretPosition = useCallback((element: HTMLElement, offset: number) => {
    const range = document.createRange()
    const selection = window.getSelection()

    let currentNode: Node | null = element
    let currentOffset = 0
    let found = false

    const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
    while ((currentNode = walk.nextNode())) {
      const nodeTextLength = currentNode.textContent?.length || 0
      if (currentOffset + nodeTextLength >= offset) {
        range.setStart(currentNode, offset - currentOffset)
        range.collapse(true)
        found = true
        break
      }
      currentOffset += nodeTextLength
    }

    if (!found) {
      range.selectNodeContents(element)
      range.collapse(false)
    }

    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [])

  // Restore cursor position after content update
  useEffect(() => {
    if (contentEditableRef.current && cursorPositionRef.current) {
      const { offset } = cursorPositionRef.current
      setCaretPosition(contentEditableRef.current, offset)
      cursorPositionRef.current = null
    }
  }, [content, setCaretPosition])

  const handleFilesUploaded = useCallback((files: UploadResult[]) => {
    setUploadedFiles((prev) => [...prev, ...files])
    setShowFileUpload(false)
    setIsExpanded(true)
  }, [])

  const removeUploadedFile = (urlToRemove: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.url !== urlToRemove))
  }

  const handleEnhanceText = async () => {
    if (!content.trim()) {
      setError("Please write some text to enhance first.")
      return
    }

    setIsEnhancingText(true)
    setError("")

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const enhancedText = `${content} ✨ Enhanced with better engagement!`
      setContent(enhancedText)
      
      toast({
        title: "Text Enhanced!",
        description: "Your text has been improved for better engagement.",
      })
    } catch (err) {
      setError("Failed to enhance text. Please try again.")
    } finally {
      setIsEnhancingText(false)
    }
  }

  const fetchMentionUsers = async (q: string) => {
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) return
      const data = await res.json()
      setMentionResults(data)
    } catch {}
  }

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (contentEditableRef.current) {
      const offset = getCaretCharacterOffset(contentEditableRef.current)
      cursorPositionRef.current = { offset: offset }
    }
    const text = (e.currentTarget.textContent || "")
    setContent(text)

    const m = text.slice(0, getCaretCharacterOffset(contentEditableRef.current!)).match(/@([a-zA-Z0-9_]{1,20})$/)
    if (m && m[1]) {
      setMentionQuery(m[1])
      setShowMentionList(true)
      fetchMentionUsers(m[1])
    } else {
      setShowMentionList(false)
      setMentionQuery("")
    }
  }

  const insertMention = (username: string) => {
    if (!contentEditableRef.current) return
    const caretOffset = getCaretCharacterOffset(contentEditableRef.current)
    const text = content
    const upto = text.slice(0, caretOffset)
    const rest = text.slice(caretOffset)
    const replaced = upto.replace(/@([a-zA-Z0-9_]{1,20})$/, `@${username} `)
    const newText = replaced + rest
    setContent(newText)
    setShowMentionList(false)
    // Re-render innerHTML with highlights
    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = newText ? highlight(newText) : ""
      setCaretPosition(contentEditableRef.current, replaced.length)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && uploadedFiles.length === 0) {
      setError("Please add some content or media to your post.")
      return
    }

    if (isOverLimit) {
      setError(`Please keep your post under ${MAX_CHARACTERS} characters.`)
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
    setError("")

    try {
      const mediaUrls = uploadedFiles.map((file) => file.url)
      let mediaType = null
      
      if (mediaUrls.length > 0) {
        const hasVideo = uploadedFiles.some((file) => file.contentType.startsWith("video/"))
        mediaType = hasVideo ? "video" : "image"
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          privacy,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
          mediaType: mediaType,
          hashtags: extract(content).hashtags,
          mentions: extract(content).mentions,
          urls: extract(content).urls,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create post")
      }

      const newPost = await response.json()

      setContent("")
      setIsExpanded(false)
      setUploadedFiles([])
      onPostCreated?.(newPost)

      toast({
        title: "Success",
        description: "Your post has been created!",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      setError(error instanceof Error ? error.message : "Failed to create post")
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
    setUploadedFiles([])
    setError("")
  }

  const privacyOptions = [
    { value: "public", icon: Globe, label: "Public" },
    { value: "friends", icon: Users, label: "Friends" },
    { value: "private", icon: Lock, label: "Only me" }
  ]

  return (
    <Card className="border-2  border-gray-200 rounded-md bg-white">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
            <AvatarFallback className="bg-blue-500 text-white font-semibold">
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className="font-semibold text-gray-900">{session?.user?.displayName}</span>
            </div>
            
            <div className="flex items-center mb-2 text-xs">
              <span className="font-semibold text-gray-900">{session?.user?.username || "User"}</span>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div
                ref={contentEditableRef}
                className="w-full border-0 resize-none outline-none focus:ring-0 p-0 bg-transparent min-h-[60px] text-lg"
                style={{ wordWrap: 'break-word' }}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onFocus={handleTextareaFocus}
                data-placeholder="What's on your mind?"
                dangerouslySetInnerHTML={{ 
                  __html: content ? highlight(content) : ""
                }}
              />

              {showMentionList && mentionResults.length > 0 && (
                <div className="mt-2 border rounded-md bg-white shadow p-2 max-h-40 overflow-auto">
                  {mentionResults.map(u => (
                    <button type="button" key={u._id} className="w-full text-left p-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => insertMention(u.username)}>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.avatarUrl || undefined} />
                        <AvatarFallback>{u.displayName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{u.displayName}</span>
                      <span className="text-xs text-gray-500">@{u.username}</span>
                    </button>
                  ))}
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.url} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                      {file.contentType.startsWith("image/") ? (
                        <img
                          src={file.url}
                          alt="Media preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video src={file.url} controls className="w-full h-full object-cover" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full h-6 w-6"
                        onClick={() => removeUploadedFile(file.url)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && (
                <>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleEnhanceText}
                        disabled={isEnhancingText || !content.trim()}
                        className="text-purple-500 h-8"
                      >
                        {isEnhancingText ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-1" />
                        )}
                        Enhance
                      </Button>
                    </div>
                    <span className={`${isOverLimit ? "text-red-500" : "text-gray-500"} text-sm`}>
                      {remainingChars}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFileUpload(true)}
                        disabled={uploadedFiles.length >= MAX_MEDIA_FILES}
                        className="text-gray-600"
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Photo/Video
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-600"
                      >
                        <Smile className="h-4 w-4 mr-1" />
                        GIF
                      </Button>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || (!content.trim() && uploadedFiles.length === 0) || isOverLimit}
                        className="bg-blue-500 text-white hover:bg-blue-600"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Post"
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </form>

            {error && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {!isExpanded && content.length === 0 && (
          <div className="mt-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-12 justify-start space-x-2 text-gray-600 hover:bg-gray-50 border border-gray-200"
                onClick={() => setShowFileUpload(true)}
              >
                <ImageIcon className="h-5 w-5 text-green-600" />
                <span>Photo/Video</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-12 justify-start space-x-2 text-gray-600 hover:bg-gray-50 border border-gray-200"
                onClick={handleTextareaFocus}
              >
                <Smile className="h-5 w-5 text-yellow-500" />
                <span>What's new?</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {showFileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Upload Files</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowFileUpload(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4">
              <FileUpload
                onUploadComplete={handleFilesUploaded}
                maxFiles={MAX_MEDIA_FILES - uploadedFiles.length}
                pathPrefix={`posts/${session?.user?.id}`}
              />
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}