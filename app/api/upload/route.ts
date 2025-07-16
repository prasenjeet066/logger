import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const type = formData.get("type") as string | null
    const userId = formData.get("userId") as string | null

    if (!file || !type || !userId) {
      return NextResponse.json({ error: "Missing file, type, or userId" }, { status: 400 })
    }

    // Simulate file upload to a storage service (e.g., Vercel Blob)
    // In a real application, you would upload the file here and get its public URL.
    // For now, we'll return a placeholder URL.
    const fileExt = file.name.split(".").pop()
    const simulatedFileName = `${userId}/${type}-${Date.now()}.${fileExt}`
    const publicUrl = `/placeholder.svg?text=${type}` // Using a generic placeholder for now

    // You would typically save the file to a storage service here
    // For example, with Vercel Blob:
    // const blob = await put(simulatedFileName, file, { access: 'public' });
    // const publicUrl = blob.url;

    return NextResponse.json({ publicUrl }, { status: 200 })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
