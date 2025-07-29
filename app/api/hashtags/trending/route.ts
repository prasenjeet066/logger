import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb/connection"
import { PostHashtag } from "@/lib/mongodb/models/PostHashtag"

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Aggregate top 10 trending hashtags based on count of usage in PostHashtag
    const trendingHashtags = await PostHashtag.aggregate([
      {
        $group: {
          _id: "$hashtagName", // group by hashtagName
          postsCount: { $sum: 1 } // count how many times it appears
        },
      },
      { $sort: { postsCount: -1 } },
      { $limit: 10 }
    ])
    
    return NextResponse.json(
      trendingHashtags.map(tag => ({
        hashtag: tag._id, // hashtag name
        postsCount: tag.postsCount // number of posts that used it
      }))
    )
  } catch (error) {
    console.error("Error fetching trending hashtags:", error)
    return NextResponse.json({ error: "Failed to fetch trending hashtags" }, { status: 500 })
  }
}