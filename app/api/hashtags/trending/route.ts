import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb/connection"
import { Hashtag } from "@/lib/mongodb/models/Hashtag"

export async function GET() {
  try {
    await connectDB()
    const hashtags = await Hashtag.find()
      .sort({ postsCount: -1 })
      .limit(10)
      .lean()

    return NextResponse.json(
      hashtags.map((tag) => ({
        tag: tag.name,
        posts: tag.postsCount,
      }))
    )
  } catch (error) {
    console.error("Trending hashtags error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}