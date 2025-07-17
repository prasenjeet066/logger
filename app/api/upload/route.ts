import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { blobStorage } from "@/lib/blob/client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const pathPrefix = (formData.get("pathPrefix") as string) || ""
    const maxSize = Number(formData.get("maxSize")) || 50 * 1024 * 1024 // 50MB default

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Validate all files first
    const validationErrors: string[] = []
    const validFiles: File[] = []

    files.forEach((file, index) => {
      if (!(file instanceof File)) {
        validationErrors.push(`Item ${index + 1} is not a valid file`)
        return
      }

      const validation = blobStorage.validateFile(file, { maxSize })
      if (!validation.isValid) {
        validationErrors.push(`File ${index + 1} (${file.name}): ${validation.error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "File validation failed",
          details: validationErrors,
        },
        { status: 400 },
      )
    }

    // Upload valid files
    const uploadResults = await blobStorage.uploadMultipleFiles(validFiles, {
      pathPrefix: pathPrefix || `users/${session.user.id}`,
      addRandomSuffix: true,
      cacheControlMaxAge: 3600,
    })

    return NextResponse.json({
      success: true,
      files: uploadResults,
      message: `Successfully uploaded ${uploadResults.length} file(s)`,
    })
  } catch (error) {
    console.error("Upload API error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
