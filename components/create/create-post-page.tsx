
"use client"
import { toast } from "sonner"
import { createPostSchema } from "@/lib/validations/post"
import { useState, useRef, useCallback, useEffect } from "react"
import { Spinner } from "@/components/loader/spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { FileUpload } from "@/components/upload/file-upload"
import { useAppDispatch, useAppSelector } from "@/store/main"
import {
  nsfwMedia
} from "@/store/slices/postsSlice"
import {
  setUploadedFiles,
  addUploadedFiles,
  removeUploadedFile,
  setGiphyMedia,
  addGiphyMedia,
  removeGiphyMedia,
  setIsPosting,
  setError,
  setIsPosted,
  resetPostState,
  setPoll,
} from "@/store/slices/underPostSlice"
import type { UploadResult } from "@/lib/blob/client"
import {
  ImageIcon,
  Smile,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  Plus,
  Vote,
  HandHelping,
  FileWarning,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react"

const MAX_CHARACTERS = 380
const MAX_MEDIA_FILES = 4
const MIN_POLL_OPTIONS = 2
const MAX_POLL_OPTIONS = 4
const GIPHY_API_KEY = "j5e65Yg6H9qAOCKrZYyJr9Odyo9oGY9L"
const GIPHY_BASE_URL = "https://api.giphy.com/v1"

interface CreatePostPageProps {
  user: any
}

interface GiphyMedia {
  url: string
  type: "gif" | "sticker"
  id: string
}

interface FactCheckResult {
  FactCheckInfo: string;
  IsHarmful: boolean;
  Is18Plus: boolean;
  headlineOfFactCheckInfo: boolean;
  NeedVerifyWithSearch: boolean;
  ContentTypeOrContextType: string;
  timestamp?: string;
  model?: string;
  hasImages?: boolean;
  imageCount?: number;
}

export default function CreatePostPage({ user }: CreatePostPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const dispatch = useAppDispatch()
  
  // Redux selectors
  const {
    uploadedFiles,
    giphyMedia,
    isPosting,
    error,
    isPosted,
    poll
  } = useAppSelector((state) => state.createPost)
  const nsfwResults = useAppSelector((state) => state.posts.nsfwResults)
  
  // Local state (UI-specific)
  const contentEditableRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState("")
  const [gifs, setGifs] = useState<any[]>([])
  const [showGiphyPicker, setShowGiphyPicker] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showAddOptions, setShowAddOptions] = useState(false)
  const cursorPositionRef = useRef<{ node: Node | null; offset: number } | null>(null)
  
  // Fact-checking state
  const [isFactChecking, setIsFactChecking] = useState(false)
  const [factCheckResult, setFactCheckResult] = useState<FactCheckResult | null>(null)
  const [showFactCheckResult, setShowFactCheckResult] = useState(false)
  
  const characterCount = content.length
  const isOverLimit = characterCount > MAX_CHARACTERS
  const progressPercentage = (characterCount / MAX_CHARACTERS) * 100
  const totalMediaCount = uploadedFiles.length + giphyMedia.length
  const [_FileList, setFileList] = useState<any>(null)
  
  const handleFiles = (files: any) => {
    setFileList(files)
  }
  
  const getProgressColor = () => {
    if (progressPercentage < 70) return "bg-green-500"
    if (progressPercentage < 90) return "bg-yellow-500"
    return "bg-red-500"
  }
  
  useEffect(() => {
    fetchTrending()
  }, [])
  
  const fetchTrending = async () => {
    try {
      const gifsResponse = await fetch(`${GIPHY_BASE_URL}/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`)
      const gifsData = await gifsResponse.json()
      setGifs(
        gifsData.data.map((gif: any) => ({
          id: gif.id,
          url: gif.images?.original?.url,
        })) || [],
      )
    } catch (error) {
      console.error("Error fetching trending media:", error)
      dispatch(setError("Failed to load trending GIFs"))
    }
  }
  
  const handleAddPollOption = () => {
    if (poll.options.length < MAX_POLL_OPTIONS) {
      dispatch(setPoll({ options: [...poll.options, ""] }))
    }
  }
  
  const handleRemovePollOption = (index: number) => {
    if (poll.options.length > MIN_POLL_OPTIONS) {
      dispatch(setPoll({ options: poll.options.filter((_, i) => i !== index) }))
    }
  }
  
  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...poll.options]
    newOptions[index] = value
    dispatch(setPoll({ options: newOptions }))
  }
  
  const handleCancelPoll = () => {
    dispatch(setPoll({
      show: false,
      question: "",
      options: ["", ""],
      duration: "1 day"
    }))
    dispatch(setError(null))
  }
  
  const handleFilesUploaded = useCallback((files: UploadResult[]) => {
    dispatch(addUploadedFiles(files))
    setShowFileUpload(false)
  }, [dispatch])
  
  const handleRemoveUploadedFile = (urlToRemove: string) => {
    dispatch(removeUploadedFile(urlToRemove))
  }

  const performFactCheck = useCallback(async (textContent: string, imageFiles?: File[]) => {
    if (!textContent.trim() && (!imageFiles || imageFiles.length === 0)) return;
    
    setIsFactChecking(true);
    setFactCheckResult(null);
    
    try {
      let requestOptions: RequestInit;

      if (imageFiles && imageFiles.length > 0) {
        // Use FormData for image uploads
        const formData = new FormData();
        
        formData.append('messages', JSON.stringify([
          { role: 'user', content: textContent || 'Please analyze these images.' }
        ]));
        
        // Add image files
        imageFiles.forEach((file) => {
          formData.append('images', file);
        });

        requestOptions = {
          method: 'POST',
          body: formData,
        };
      } else {
        // Use JSON for text-only requests
        requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: textContent }
            ]
          }),
        };
      }

      const response = await fetch('/api/context/bots/info/', requestOptions);
      
      if (!response.ok) {
        throw new Error(`Fact-check failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      setFactCheckResult(result);
      setShowFactCheckResult(true);
      
      // Show warning if content is harmful or needs verification
      if (result.IsHarmful || result.NeedVerifyWithSearch) {
        toast.warning("Content flagged for review", {
          description: result.IsHarmful ? "Potentially harmful content detected" : "Content may need fact verification"
        });
      }
      
    } catch (error) {
      console.error('Fact-check error:', error);
      toast.error("Fact-check failed", {
        description: "Unable to verify content. Please review manually."
      });
    } finally {
      setIsFactChecking(false);
    }
  }, []);

  // Convert uploaded files to File objects for fact-checking
  const getImageFilesForFactCheck = useCallback(async (): Promise<File[]> => {
    const imageFiles: File[] = [];
    
    for (const uploadedFile of uploadedFiles) {
      if (uploadedFile.contentType.startsWith('image/')) {
        try {
          const response = await fetch(uploadedFile.url);
          const blob = await response.blob();
          const file = new File([blob], `image-${Date.now()}.jpg`, { 
            type: uploadedFile.contentType 
          });
          imageFiles.push(file);
        } catch (error) {
          console.error('Error converting uploaded file to File object:', error);
        }
      }
    }
    
    return imageFiles;
  }, [uploadedFiles]);

  // Trigger fact-check when content or images change


  const handlePost = async () => {
    if (!content.trim() && totalMediaCount === 0 && !poll.show) {
      dispatch(setError("Please add some content, media, or a poll to your post."))
      return
    }
    
    if (isOverLimit) {
      dispatch(setError(`Please keep your post under ${MAX_CHARACTERS} characters.`))
      return
    }
    
    // Check for harmful content before posting
    if (factCheckResult?.IsHarmful) {
      const confirmPost = window.confirm(
        "This content has been flagged as potentially harmful. Are you sure you want to post it?"
      );
      if (!confirmPost) return;
    }
    
    if (poll.show) {
      if (!poll.question.trim()) {
        dispatch(setError("Poll question cannot be empty."))
        return
      }
      
      const trimmedOptions = poll.options.filter((opt) => opt.trim())
      if (trimmedOptions.length < MIN_POLL_OPTIONS) {
        dispatch(setError(`Please provide at least ${MIN_POLL_OPTIONS} non-empty poll options.`))
        return
      }
      
      if (!poll.duration) {
        dispatch(setError("Please select a poll duration."))
        return
      }
    }
    
    dispatch(setIsPosting(true))
    dispatch(setError(null))
    
    try {
      const validatedData = createPostSchema.parse({ content })
      
      const uploadedMediaUrls = uploadedFiles.map((file) => file.url)
      const giphyUrls = giphyMedia.map((gif) => gif.url)
      const allMediaUrls = [...uploadedMediaUrls, ...giphyUrls]
      
      let mediaType: string | null = null
      if (allMediaUrls.length > 0) {
        const hasVideo = uploadedFiles.some((file) => file.contentType.startsWith("video/"))
        if (hasVideo) {
          mediaType = "video"
        } else if (giphyMedia.length > 0) {
          mediaType = "gif"
        } else {
          mediaType = "image"
        }
      }
      
      // Include fact-check results in post submission
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: validatedData.content,
          mediaUrls: allMediaUrls,
          mediaType,
          reviewResults: factCheckResult, // Include fact-check results
          nsfwResults: Object.keys(nsfwResults || {}).length > 0 ? nsfwResults : null,
          
          ...(poll.show && {
            poll: {
              question: poll.question,
              options: poll.options.filter(opt => opt.trim()),
              duration: poll.duration
            }
          })
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        dispatch(setError(errorData.error || "Failed to create post"))
        return
      }
      
      const postData = await response.json()
      
      // Reset state after successful post
      dispatch(resetPostState())
      setContent("")
      setFactCheckResult(null)
      setShowFactCheckResult(false)
      if (contentEditableRef.current) {
        contentEditableRef.current.textContent = ""
        contentEditableRef.current.classList.add("placeholder-shown")
      }
      
      toast("Post has been created", {
        action: {
          label: "View",
          onClick: () => router.push("/dashboard"),
        },
      })
      
      dispatch(setIsPosted(true))
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Post submission error:", err)
      dispatch(setError(err.message || "An error occurred while submitting the post."))
    } finally {
      dispatch(setIsPosting(false))
    }
  }

  const handleGiphySelect = (gif: any, type: "gif" | "sticker") => {
    const giphyItem: GiphyMedia = {
      url: gif.url || "https://media.giphy.com/media/efg1234/giphy.gif",
      type,
      id: gif.id || Math.random().toString(36).substr(2, 9),
    }
    
    if (totalMediaCount >= MAX_MEDIA_FILES) {
      dispatch(setError("You can only add up to 4 media items"))
      return
    }
    
    dispatch(addGiphyMedia(giphyItem))
    setShowGiphyPicker(false)
    dispatch(setError(null))
  }
  
  const handleRemoveGiphyMedia = (id: string) => {
    dispatch(removeGiphyMedia(id))
  }
  
  const insertText = (text: string) => {
    if (contentEditableRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        const textNode = document.createTextNode(text)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.setEndAfter(textNode)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        contentEditableRef.current.focus()
        document.execCommand("insertText", false, text)
      }
      setContent(contentEditableRef.current.textContent || "")
    }
  }
  
  const remainingChars = MAX_CHARACTERS - characterCount
  
  const highlightContent = (text: string) => {
    const div = document.createElement("div")
    div.textContent = text
    let escapedText = div.innerHTML
    
    escapedText = escapedText.replace(
      /#([a-zA-Z0-9_\u0980-\u09FF]+)/g,
      '<span style="color: #1DA1F2; font-weight: bold;">#$1</span>',
    )
    
    escapedText = escapedText.replace(
      /@([a-zA-Z0-9_]+)/g,
      '<span style="color: #1DA1F2; font-weight: bold;">@$1</span>',
    )
    escapedText = escapedText.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #1DA1F2; text-decoration: underline;">$1</a>',
    )
    return escapedText
  }
  
  const featureOptions = [
    {
      icon: ImageIcon,
      label: "Photo/Video",
      onClick: () => setShowFileUpload(true),
      disabled: totalMediaCount >= MAX_MEDIA_FILES,
    },
    {
      icon: Smile,
      label: "Gif",
      onClick: () => setShowGiphyPicker(true),
      disabled: totalMediaCount >= MAX_MEDIA_FILES,
    },
    {
      icon: Vote,
      label: "Poll",
      onClick: () => dispatch(setPoll({ show: !poll.show })),
      disabled: false,
    },
    { icon: FileWarning, label: "Lost Notice", onClick: () => console.log("Lost Notice clicked") },
    { icon: Calendar, label: "Event", onClick: () => console.log("Event clicked") },
  ]
  
  const getCaretCharacterOffset = useCallback((element: HTMLElement) => {
    let caretOffset = 0
    const doc = element.ownerDocument
    const win = doc.defaultView
    const sel = win?.getSelection()
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
  
  useEffect(() => {
    if (contentEditableRef.current && cursorPositionRef.current) {
      const { offset } = cursorPositionRef.current
      setCaretPosition(contentEditableRef.current, offset)
      cursorPositionRef.current = null
    }
  }, [content, setCaretPosition])
  
  useEffect(() => {
    if (contentEditableRef.current && !content.trim()) {
      contentEditableRef.current.textContent = contentEditableRef.current.dataset.placeholder || ""
      contentEditableRef.current.classList.add("placeholder-shown")
    }
  }, [])
  
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((file) => {
        const isImage = file.contentType.startsWith("image/")
        if (isImage) {
          // Generate a temporary ID for the post or use a placeholder
          const tempPostId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          dispatch(nsfwMedia({
            postId: tempPostId, // Provide a valid string ID
            mediaUrls: [file.url]
          }))
        }
      })
    }
  }, [uploadedFiles, dispatch])
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Create Post</h1>
          <Button
            onClick={handlePost}
            disabled={isPosting || (!content.trim() && totalMediaCount === 0 && !poll.show) || isOverLimit}
            className="text-white px-4 py-2 rounded-full border font-semibold"
          >
            {isPosting ? <Spinner className="h-5 w-5" /> : "Post"}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={session?.user?.avatarUrl || "https://placehold.co/48x48/aabbcc/ffffff?text=U"} />
            <AvatarFallback>{"U"}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col items-start justify-center'>
            <span className="font-semibold text-lg">{session?.user?.displayName || "User"}</span>
            <span className="text-xs text-gray-600">@{session?.user?.username || "username"}</span>
          </div>
        </div>

        <div className="mb-4">
          <div
            ref={contentEditableRef}
            className="w-full border-0 resize-none text-lg focus:ring-0 outline-none"
            style={{ minHeight: "120px" }}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              if (contentEditableRef.current) {
                const offset = getCaretCharacterOffset(contentEditableRef.current)
                cursorPositionRef.current = { node: null, offset: offset }
              }
              setContent(e.currentTarget.textContent || "")
            }}
            data-placeholder="What do you want to talk about?"
            onFocus={(e) => {
              if (e.target.textContent === e.target.dataset.placeholder) {
                e.target.textContent = ""
                e.target.classList.remove("placeholder-shown")
              }
            }}
            onBlur={(e) => {
              if (!e.target.textContent?.trim()) {
                e.target.textContent = e.target.dataset.placeholder || ""
                e.target.classList.add("placeholder-shown")
              }
            }}
            dangerouslySetInnerHTML={{ __html: content ? highlightContent(content) : "" }}
          />
          
          <style jsx>{`
            [contenteditable][data-placeholder]:empty:before {
              content: attr(data-placeholder);
              color: #9ca3af;
              pointer-events: none;
              display: block;
            }
            [contenteditable]:empty.placeholder-shown:before {
              content: attr(data-placeholder);
              color: #9ca3af;
              pointer-events: none;
              display: block;
            }
          `}</style>
        </div>

        {/* Fact Check Result Display */}
        {isFactChecking && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Checking content...</AlertDescription>
          </Alert>
        )}

        {factCheckResult  && factCheckResult.FactCheckInfo!==null  && showFactCheckResult && (
          <Alert variant={factCheckResult.IsHarmful ? "destructive" : "default"} className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Content Analysis:</strong> {factCheckResult.FactCheckInfo}</p>
                {factCheckResult.IsHarmful && (
                  <p className="text-red-600"><strong>Warning:</strong> Potentially harmful content detected</p>
                )}
                {factCheckResult.NeedVerifyWithSearch && (
                  <p className="text-yellow-600"><strong>Notice:</strong> Content may need fact verification</p>
                )}
                <p className="text-sm text-gray-600">Content Type: {factCheckResult.ContentTypeOrContextType}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFactCheckResult(false)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Poll Creator */}
        {poll.show && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Create Poll</h3>
              <Button variant="ghost" size="sm" onClick={handleCancelPoll}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Input
              placeholder="Ask a question..."
              value={poll.question}
              onChange={(e) => dispatch(setPoll({ question: e.target.value }))}
              className="mb-3"
            />
            
            <div className="space-y-2 mb-3">
              {poll.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                    className="flex-1"
                  />
                  {poll.options.length > MIN_POLL_OPTIONS && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePollOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {poll.options.length < MAX_POLL_OPTIONS && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPollOption}
                className="mb-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
            
            <Select value={poll.duration} onValueChange={(value) => dispatch(setPoll({ duration: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Poll duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 hour">1 Hour</SelectItem>
                <SelectItem value="6 hours">6 Hours</SelectItem>
                <SelectItem value="1 day">1 Day</SelectItem>
                <SelectItem value="3 days">3 Days</SelectItem>
                <SelectItem value="7 days">7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Media Previews */}
        {(uploadedFiles.length > 0 || giphyMedia.length > 0) && (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {uploadedFiles.map((file) => (
              <div key={file.url} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                {file.contentType.startsWith("image/") ? (
                  <img
                    src={file.url || "/placeholder.svg"}
                    alt="Media preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video src={file.url} controls className="w-full h-full object-cover" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full h-6 w-6"
                  onClick={() => handleRemoveUploadedFile(file.url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {giphyMedia.map((gif) => (
              <div key={gif.id} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                <img src={gif.url || "/placeholder.svg"} alt="Giphy media" className="w-full h-full object-cover" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full h-6 w-6"
                  onClick={() => handleRemoveGiphyMedia(gif.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Character Counter */}

        {content.length > 0 && (
          <div className="flex items-center justify-between mt-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 relative">
                <svg className="w-8 h-8 transform -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${progressPercentage * 0.88} 88`}
                    className={getProgressColor()}
                  />
                </svg>
              </div>
              <span className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                {remainingChars}
              </span>
            </div>
          </div>
        )}

        <Separator className="my-6" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add to your post</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowAddOptions(!showAddOptions)}>
            {showAddOptions ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {showAddOptions && (
          <div className="grid grid-cols-2 gap-4">
            {featureOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <Card
                  key={index}
                  className="flex items-center justify-between p-4 bg-blue-50 border-none cursor-pointer hover:bg-gray-50 transition-colors shadow-none"
                  onClick={option.disabled ? undefined : option.onClick}
                  tabIndex={option.disabled ? -1 : 0}
                  aria-disabled={option.disabled}
                  style={option.disabled ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gray-800" />
                    <span className="font-medium text-gray-800">{option.label}</span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <Card className="w-full max-w-2xl shadow-none border max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <h2 className="text-lg font-semibold">Upload Files</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFileUpload(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-2 p-4">
              <FileUpload
               handlefiles={handleFiles} onUploadComplete={handleFilesUploaded}
                maxFiles={MAX_MEDIA_FILES - totalMediaCount}
                pathPrefix={`posts/${session?.user?.id}`}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Giphy Picker Modal */}
      {showGiphyPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <Card className="w-full max-w-lg shadow-none border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <h2 className="text-lg font-semibold">Select a GIF or Sticker</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowGiphyPicker(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-2 p-4">
              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {gifs.map((gif) => (
                  <div
                    key={gif.id}
                    className="relative aspect-video rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => handleGiphySelect(gif, "gif")}
                  >
                    <img src={gif.url || "/placeholder.svg"} alt="Giphy" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">Powered by Giphy API</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
