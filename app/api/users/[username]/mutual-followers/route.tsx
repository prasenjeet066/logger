// app/api/users/[username]/mutual-followers/route.ts

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import connectDB from "@/lib/mongodb/connection"
import { Follow } from "@/lib/mongodb/models/Follow"
import { User } from "@/lib/mongodb/models/User"
import { isValidObjectId } from "mongoose"

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Find the current user by email
    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 })
    }

    // Find the target user by username or ObjectId
    let targetUser = null
    if (isValidObjectId(params.username)) {
      targetUser = await User.findById(params.username)
    }
    if (!targetUser) {
      targetUser = await User.findOne({ username: params.username })
    }

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If the target user is the same as current user, return empty
    if (targetUser._id.toString() === currentUser._id.toString()) {
      return NextResponse.json({ 
        followers: [], 
        totalCount: 0 
      })
    }

    // Find mutual followers using aggregation:
    // 1. Find all users that the current user follows
    // 2. Filter those who also follow the target user
    const mutualFollowers = await Follow.aggregate([
      // Stage 1: Match follows where current user is the follower
      {
        $match: {
          followerId: currentUser._id.toString()
        }
      },
      // Stage 2: Lookup to check if these users also follow the target user
      {
        $lookup: {
          from: "follows", // Collection name for Follow model
          let: { followingUserId: "$followingId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$followerId", "$$followingUserId"] },
                    { $eq: ["$followingId", targetUser._id.toString()] }
                  ]
                }
              }
            }
          ],
          as: "alsoFollowsTarget"
        }
      },
      // Stage 3: Only keep users who also follow the target
      {
        $match: {
          "alsoFollowsTarget.0": { $exists: true }
        }
      },
      // Stage 4: Convert followingId to ObjectId and lookup user details
      {
        $addFields: {
          followingObjectId: { $toObjectId: "$followingId" }
        }
      },
      {
        $lookup: {
          from: "users", // Collection name for User model
          localField: "followingObjectId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      // Stage 5: Unwind and project needed fields
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          _id: "$userDetails._id",
          username: "$userDetails.username",
          displayName: "$userDetails.displayName",
          avatarUrl: "$userDetails.avatarUrl"
        }
      },
      // Stage 6: Sort by display name
      {
        $sort: { displayName: 1 }
      },
      // Stage 7: Limit to prevent too much data
      {
        $limit: 50
      }
    ])

    // Return the mutual followers with total count
    return NextResponse.json({
      followers: mutualFollowers,
      totalCount: mutualFollowers.length
    })

  } catch (error) {
    console.error("Error fetching mutual followers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}