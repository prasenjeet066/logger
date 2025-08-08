"use client"

import type React from "react"
import { useCallback, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Upload, X, File, ImageIcon, Video, AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UploadResult } from "@/lib/blob/client"
interface FileUploadProps {
  handlefiles?: (_files)=> void
  onUploadComplete?: (files: UploadResult[]) => void
  onFilesChange?: (files: UploadResult[]) => void
  maxFiles?: number
  maxSize?: number
  allowedTypes?: string[]
  pathPrefix?: string
  className?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
}

interface UploadedFile extends UploadResult {
  id: string
  preview?: string
  type: "image" | "video" | "other"
}

export function FileUpload({
  handlefiles,
  onUploadComplete,
  onFilesChange,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/mov",
    "video/avi",
  ],
  pathPrefix,
  className,
  accept = "image/*,video/*",
  multiple = true,
  disabled = false,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { uploadFiles, deleteFiles, isUploading, uploadProgress, error, clearError } = useFileUpload({
    maxSize,
    allowedTypes,
    pathPrefix,
    onUploadComplete: (results) => {
      const newFiles: UploadedFile[] = results.map((result) => ({
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        type: result.contentType.startsWith("image/")
          ? "image"
          : result.contentType.startsWith("video/")
            ? "video"
            : "other",
        preview: result.contentType.startsWith("image/") ? result.url : undefined,
      }))

      setUploadedFiles((prev) => [...prev, ...newFiles])
      onUploadComplete?.(results)
      onFilesChange?.([...uploadedFiles, ...newFiles])
    },
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled || isUploading) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileUpload(files)
      }
    },
    [disabled, isUploading],
  )

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileUpload(files)
      handlefiles(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ""
  }, [])

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (uploadedFiles.length + files.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`)
        return
      }

      clearError()

      try {
        await uploadFiles(files)
      } catch (err) {
        console.error("Upload error:", err)
      }
    },
    [uploadedFiles.length, maxFiles, uploadFiles, clearError],
  )

  const handleRemoveFile = useCallback(
    async (fileToRemove: UploadedFile) => {
      try {
        await deleteFiles([fileToRemove.url])
        setUploadedFiles((prev) => {
          const newFiles = prev.filter((file) => file.id !== fileToRemove.id)
          onFilesChange?.(newFiles)
          return newFiles
        })

        // Clean up preview URL if it's a blob URL
        if (fileToRemove.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(fileToRemove.preview)
        }
      } catch (err) {
        console.error("Delete error:", err)
      }
    },
    [deleteFiles, onFilesChange],
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 px-4">
          <Upload className={cn("h-8 w-8 mb-4", dragActive ? "text-blue-500" : "text-gray-400")} />

          <div className="text-center">
            <p className="text-sm font-medium mb-1">
              {dragActive ? "Drop files here" : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-gray-500">
              {allowedTypes.includes("image/jpeg") && "Images"}
              {allowedTypes.includes("video/mp4") && allowedTypes.includes("image/jpeg") && " and "}
              {allowedTypes.includes("video/mp4") && "Videos"} up to {Math.round(maxSize / (1024 * 1024))}MB
            </p>
            <p className="text-xs text-gray-400 mt-1">Maximum {maxFiles} files</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Uploading...</span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {file.preview ? (
                    <img
                      src={file.preview || "/placeholder.svg"}
                      alt="Preview"
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.pathname.split("/").pop()}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.contentType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
