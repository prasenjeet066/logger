import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { connectDB } from "@/lib/mongodb/connection"
import Notification from "@/lib/mongodb/models/Notification"
import {User} from "@/lib/mongodb/models/User" // Assuming User model is needed for population

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await connectDB()

    const notifications = await Notification.find({ recipient: session.user.id })
      .populate({
        path: "fromUser",
        select: "username avatarUrl", // Select only necessary fields
        model: User, // Explicitly specify the model
      })
      .populate({
        path: "post",
        select: "content", // Select only necessary fields
        model: "Post", // Assuming Post model is named 'Post'
      })
      .sort({ createdAt: -1 })
      .lean() // Return plain JavaScript objects

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
