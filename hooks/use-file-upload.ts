"use client"

import { useState, useCallback } from "react"
import { blobStorage, type UploadResult } from "@/lib/blob/client"

interface UseFileUploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
  pathPrefix?: string
  onUploadStart?: () => void
  onUploadComplete?: (results: UploadResult[]) => void
  onUploadError?: (error: string) => void
}

interface UseFileUploadReturn {
  uploadFiles: (files: File[]) => Promise<UploadResult[]>
  deleteFiles: (urls: string[]) => Promise<void>
  isUploading: boolean
  uploadProgress: number
  error: string | null
  clearError: () => void
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const {
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
    allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "mp4", "webm", "mov", "avi"],
    pathPrefix = "",
    onUploadStart,
    onUploadComplete,
    onUploadError,
  } = options

  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      if (!files || files.length === 0) {
        throw new Error("No files provided")
      }

      setIsUploading(true)
      setError(null)
      setUploadProgress(0)
      onUploadStart?.()

      try {
        // Validate files
        const validationErrors: string[] = []
        files.forEach((file, index) => {
          const validation = blobStorage.validateFile(file, {
            maxSize,
            allowedTypes,
            allowedExtensions,
          })
          if (!validation.isValid) {
            validationErrors.push(`File ${index + 1} (${file.name}): ${validation.error}`)
          }
        })

        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join("; "))
        }

        // Create FormData
        const formData = new FormData()
        files.forEach((file) => {
          formData.append("files", file)
        })
        if (pathPrefix) {
          formData.append("pathPrefix", pathPrefix)
        }
        formData.append("maxSize", maxSize.toString())

        // Upload via API
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Upload failed")
        }

        const result = await response.json()
        setUploadProgress(100)
        onUploadComplete?.(result.files)

        return result.files
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Upload failed"
        setError(errorMessage)
        onUploadError?.(errorMessage)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [maxSize, allowedTypes, allowedExtensions, pathPrefix, onUploadStart, onUploadComplete, onUploadError],
  )

  const deleteFiles = useCallback(async (urls: string[]): Promise<void> => {
    if (!urls || urls.length === 0) {
      return
    }

    try {
      const response = await fetch("/api/upload/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Delete failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Delete failed"
      setError(errorMessage)
      throw err
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    uploadFiles,
    deleteFiles,
    isUploading,
    uploadProgress,
    error,
    clearError,
  }
}
