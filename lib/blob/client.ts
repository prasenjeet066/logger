import { put, del, list, head } from "@vercel/blob"

export interface UploadResult {
  url: string
  pathname: string
  contentType: string
  contentDisposition: string
  size: number
}

export interface BlobFile {
  url: string
  pathname: string
  size: number
  uploadedAt: Date
  contentType: string
}

export class BlobStorageClient {
  private static instance: BlobStorageClient

  static getInstance(): BlobStorageClient {
    if (!BlobStorageClient.instance) {
      BlobStorageClient.instance = new BlobStorageClient()
    }
    return BlobStorageClient.instance
  }

  async uploadFile(
    file: File,
    options?: {
      pathname?: string
      addRandomSuffix?: boolean
      cacheControlMaxAge?: number
    },
  ): Promise<UploadResult> {
    try {
      const { pathname, addRandomSuffix = true, cacheControlMaxAge = 3600 } = options || {}

      // Generate pathname if not provided
      const finalPathname = pathname || this.generatePathname(file.name, addRandomSuffix)

      const blob = await put(finalPathname, file, {
        access: "public",
        addRandomSuffix,
        cacheControlMaxAge,
      })

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType || file.type,
        contentDisposition: blob.contentDisposition || "",
        size: file.size,
      }
    } catch (error) {
      console.error("Blob upload error:", error)
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async uploadMultipleFiles(
    files: File[],
    options?: {
      pathPrefix?: string
      addRandomSuffix?: boolean
      cacheControlMaxAge?: number
    },
  ): Promise<UploadResult[]> {
    const { pathPrefix = "", addRandomSuffix = true, cacheControlMaxAge = 3600 } = options || {}

    const uploadPromises = files.map(async (file, index) => {
      const pathname = pathPrefix ? `${pathPrefix}/${this.generatePathname(file.name, addRandomSuffix)}` : undefined

      return this.uploadFile(file, {
        pathname,
        addRandomSuffix,
        cacheControlMaxAge,
      })
    })

    try {
      const results = await Promise.allSettled(uploadPromises)
      const successful: UploadResult[] = []
      const failed: string[] = []

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successful.push(result.value)
        } else {
          failed.push(`File ${index + 1}: ${result.reason}`)
        }
      })

      if (failed.length > 0) {
        console.warn("Some uploads failed:", failed)
      }

      return successful
    } catch (error) {
      console.error("Multiple file upload error:", error)
      throw new Error("Failed to upload multiple files")
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      await del(url)
    } catch (error) {
      console.error("Blob delete error:", error)
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async deleteMultipleFiles(urls: string[]): Promise<{ successful: string[]; failed: string[] }> {
    const deletePromises = urls.map((url) => this.deleteFile(url))

    try {
      const results = await Promise.allSettled(deletePromises)
      const successful: string[] = []
      const failed: string[] = []

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successful.push(urls[index])
        } else {
          failed.push(urls[index])
        }
      })

      return { successful, failed }
    } catch (error) {
      console.error("Multiple file delete error:", error)
      throw new Error("Failed to delete multiple files")
    }
  }

  async listFiles(options?: {
    prefix?: string
    limit?: number
    cursor?: string
  }): Promise<{ blobs: BlobFile[]; hasMore: boolean; cursor?: string }> {
    try {
      const { prefix, limit = 100, cursor } = options || {}

      const result = await list({
        prefix,
        limit,
        cursor,
      })

      const blobs: BlobFile[] = result.blobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        contentType: blob.contentType || "application/octet-stream",
      }))

      return {
        blobs,
        hasMore: result.hasMore,
        cursor: result.cursor,
      }
    } catch (error) {
      console.error("Blob list error:", error)
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getFileInfo(url: string): Promise<BlobFile | null> {
    try {
      const info = await head(url)

      return {
        url: info.url,
        pathname: info.pathname,
        size: info.size,
        uploadedAt: info.uploadedAt,
        contentType: info.contentType || "application/octet-stream",
      }
    } catch (error) {
      console.error("Blob head error:", error)
      return null
    }
  }

  private generatePathname(filename: string, addRandomSuffix = true): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = filename.split(".").pop()
    const baseName = filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-")

    if (addRandomSuffix) {
      return `${timestamp}-${randomString}-${baseName}.${extension}`
    }

    return `${timestamp}-${baseName}.${extension}`
  }

  validateFile(
    file: File,
    options?: {
      maxSize?: number
      allowedTypes?: string[]
      allowedExtensions?: string[]
    },
  ): { isValid: boolean; error?: string } {
    const {
      maxSize = 50 * 1024 * 1024, // 50MB default
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
    } = options || {}

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`,
      }
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`,
      }
    }

    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension .${extension} is not allowed`,
      }
    }

    return { isValid: true }
  }
}

export const blobStorage = BlobStorageClient.getInstance()
