import { NextResponse } from "next/server"
import  connectDB  from "@/lib/mongodb/connection"
import Bot from "@/lib/mongodb/models/Bot"


export async function GET() {
  try {
    await connectDB()
    const bots = await Bot.find().populate("ownerId") // optional: populate owner
    return NextResponse.json(bots)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bots" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()

    // optionally validate data here

    const newBot = await Bot.create(data)
    return NextResponse.json(newBot, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create bot" }, { status: 500 })
  }
}