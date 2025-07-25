import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connection";
import { User } from "@/lib/mongodb/models/User";

// GET /api/auth/check-username?username=chosenName
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findOne({ username }).lean();
    // If user exists, username is taken
    return NextResponse.json({ available: !user });
  } catch (error) {
    console.error("Username check error:", error);
    return NextResponse.json({ error: "Server error checking username" }, { status: 500 });
  }
}