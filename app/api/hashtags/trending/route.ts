import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb/connection"
import { Hashtag } from "@/lib/mongodb/models/Hashtag"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const trendingHashtags = await Hashtag.find().sort({ postsCount: -1 }).limit(10).lean()

    return NextResponse.json(
      trendingHashtags.map((hashtag) => ({
        ...hashtag,
        _id: hashtag._id.toString(),
      })),
    )
  } catch (error) {
    console.error("Error fetching trending hashtags:", error)
    return NextResponse.json({ error: "Failed to fetch trending hashtags" }, { status: 500 })
  }
}
