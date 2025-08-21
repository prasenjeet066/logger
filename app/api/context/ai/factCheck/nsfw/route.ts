import { NextRequest, NextResponse } from "next/server"
import { InferenceClient } from "@huggingface/inference"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || ""

    let imageFile: File | null = null

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const maybeFile = formData.get("image")
      if (maybeFile instanceof File) {
        imageFile = maybeFile
      } else {
        return NextResponse.json({ error: "Missing 'image' file" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Expected multipart/form-data with an 'image' file" }, { status: 400 })
    }

    const token = process.env.HUGGINGFACE_API_TOKEN
    if (!token) {
      // Fallback: no token configured, return neutral result
      return NextResponse.json({ label: "normal", score: 0 })
    }

    const client = new InferenceClient(token)

    // Try a commonly available NSFW model; gracefully fall back if it errors
    let predictions: Array<{ label: string; score: number }> = []
    try {
      predictions = await client.imageClassification({
        model: "Falconsai/nsfw_image_detection",
        data: imageFile as unknown as Blob,
      })
    } catch (e) {
      // Fallback to zero-result if model fails
      return NextResponse.json({ label: "normal", score: 0 })
    }

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return NextResponse.json({ label: "normal", score: 0 })
    }

    // Pick top prediction
    const top = predictions.slice().sort((a, b) => b.score - a.score)[0]

    return NextResponse.json({ label: top.label || "unknown", score: top.score || 0 })
  } catch (error) {
    console.error("NSFW route error:", error)
    return NextResponse.json({ error: "NSFW detection failed" }, { status: 500 })
  }
}