import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { blobStorage } from "@/lib/blob/client"

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 })
    }

    const deleteResults = await blobStorage.deleteMultipleFiles(urls)

    return NextResponse.json({
      success: true,
      deleted: deleteResults.successful,
      failed: deleteResults.failed,
      message: `Successfully deleted ${deleteResults.successful.length} file(s)`,
    })
  } catch (error) {
    console.error("Delete API error:", error)
    return NextResponse.json(
      {
        error: "Delete failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
