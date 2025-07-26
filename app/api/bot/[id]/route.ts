import { NextResponse } from "next/server"
import  connectDB  from "@/lib/mongodb/connection"
import Bot from "@/lib/mongodb/models/Bot"

interface Params {
  params: { id: string }
}

export async function GET(req: Request, { params }: Params) {
  try {
    await connectDB()
    const bot = await Bot.findById(params.id).populate("ownerId")
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    return NextResponse.json(bot)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bot" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    await connectDB()
    const data = await req.json()
    const updatedBot = await Bot.findByIdAndUpdate(params.id, data, { new: true })
    if (!updatedBot) return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    return NextResponse.json(updatedBot)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update bot" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    await connectDB()
    const deletedBot = await Bot.findByIdAndDelete(params.id)
    if (!deletedBot) return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    return NextResponse.json({ message: "Bot deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 })
  }
}