import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { Verification } from "@/lib/mongodb/models/Verification"
import {User} from "@/lim/mongodb/models/User"
import mongoose from "mongoose"

// GET - Get all verifications or filter by status
export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    
    const verifications = await Verification.find({
      userId : session.user.id
    })
      .select("statusIs")
    if(verifications.length >0){
    return NextResponse.json(verifications)
    }else if(verifications.length==0){
      const VerificationsStatus=  await User.find({_id:session.user.id}).select("statusIs")[0]
      if (VerificationsStatus) {
         return NextResponse.json(['A'])
      }else{
        return NextResponse.json(['C'])
      }
      
    }
  } catch (error) {
    console.error("GET /api/verification error:", error)
    return NextResponse.json(
      { error: "Failed to fetch verifications" },
      { status: 500 }
    )
  }
}

// POST - Create new verification request
export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await req.json()
    const { letterIs, selectedPlan } = json

    const verification = new Verification({
      conformBy: session.user.id,
      letterIs,
      selectedPlan,
      statusIs: "P" // Default to Pending
    })

    await verification.save()

    return NextResponse.json(verification, { status: 201 })
  } catch (error) {
    console.error("POST /api/verification error:", error)
    return NextResponse.json(
      { error: "Failed to create verification request" },
      { status: 500 }
    )
  }
}

// PATCH - Update verification status
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await req.json()
    const { id, statusIs } = json

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid verification ID" }, { status: 400 })
    }

    const verification = await Verification.findById(id)
    if (!verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 })
    }

    // Only allow valid status values
    if (!["A", "P", "R", "C"].includes(statusIs)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    verification.statusIs = statusIs
    await verification.save()

    return NextResponse.json(verification)
  } catch (error) {
    console.error("PATCH /api/verification error:", error)
    return NextResponse.json(
      { error: "Failed to update verification" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a verification request
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid verification ID" }, { status: 400 })
    }

    const verification = await Verification.findById(id)
    if (!verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 })
    }

    // Only allow deletion of own verification requests
    if (verification.conformBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this verification" }, { status: 403 })
    }

    await verification.deleteOne()

    return NextResponse.json({ message: "Verification deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/verification error:", error)
    return NextResponse.json(
      { error: "Failed to delete verification" },
      { status: 500 }
    )
  }
}