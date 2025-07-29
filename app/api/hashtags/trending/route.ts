import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb/connection"
import { PostHashtag } from "@/lib/mongodb/models/PostHashtag"

export async function GET() {
  try {
    await connectDB()
    
    // Aggregate hashtags and count how many times each appears
    const trending = await PostHashtag.aggregate([
      {
        $group: {
          _id: "$hashtagName",
          posts: { $sum: 1 }
        }
      },
      { $sort: { posts: -1 } },
      { $limit: 10 }
    ])
    
    // Format response
    return NextResponse.json(
      trending.map((item) => ({
        tag: item._id,
        posts: item.posts,
      }))
    )
  } catch (error) {
    console.error("Trending hashtags error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}