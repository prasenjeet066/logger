import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"
import { signUpSchema } from "@/lib/validations/auth"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const validatedData = signUpSchema.parse(body)

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: validatedData.email }, { username: validatedData.username }],
    })

    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
      }
      if (existingUser.username === validatedData.username) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 })
      }
    }

    // Create new user
    const user = new User({
      email: validatedData.email,
      username: validatedData.username,
      displayName: validatedData.displayName,
      password: validatedData.password,
    })

    await user.save()

    // Return user without password
    const userResponse = user.toJSON()

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userResponse,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Signup error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
